/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

import * as Vscode from "vscode";
import * as Thrift from "thrift";
import { Workbench } from "../../tools/workbench";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { OsUtils } from "../../../utils/utils";
import { ServiceLocation } from "./bindings/ServiceRegistry_types";
import { ThriftClient } from "./thriftclient";

import * as CSpyServiceRegistry from "./bindings/CSpyServiceRegistry";
import * as CSpyServiceManager from "./bindings/CSpyServiceManager";
import { SERVICE_MANAGER_SERVICE } from "./bindings/ServiceManager_types";
import { createHash } from "crypto";
import { tmpdir } from "os";

/**
 * Provides and manages thrift services for a workbench.
 */
export class ThriftServiceManager {
    /**
     * 
     * @param registryLocationPath Path to a file containing a valid {@link ServiceLocation} pointing to a service registry
     */
    constructor(private registryLocationPath: fs.PathLike) {
    }

    /**
     * Stops the service manager and all services created by it.
     * After this, the manager and its services is to be
     * considered invalid, and may not be used again. If you need
     * a service manager for the same workbench later, you may start a new one.
     */
    public async stop() {
        const serviceMgr = await this.findService(SERVICE_MANAGER_SERVICE, CSpyServiceManager);
        await serviceMgr.service.shutdown();
        serviceMgr.close();
    }

    /**
     * Connects to a service with the given name. The service must already be started
     * (or in the process of starting), otherwise this method will never return.
     */
    public async findService<T>(serviceId: string, serviceType: Thrift.TClientConstructor<T>): Promise<ThriftClient<T>> {
        const registry = await this.getServiceAt(this.getRegistryLocation(), CSpyServiceRegistry);

        const location = await registry.service.waitForService(serviceId, 1000);
        const service = await this.getServiceAt(location, serviceType);

        registry.close();

        return service;
    }

    private getRegistryLocation(): ServiceLocation {
        const locSerialized = fs.readFileSync(this.registryLocationPath);

        // These concats are a hack to create a valid thrift message. The thrift library seems unable to deserialize just a struct (at least for the json protocol)
        // Once could also do JSON.parse and manually convert it to a ServiceLocation, but this is arguably more robust
        const transport = new Thrift.TFramedTransport(Buffer.concat([Buffer.from("[1,0,0,0,"), locSerialized, Buffer.from("]")]));
        const prot = new Thrift.TJSONProtocol(transport);
        prot.readMessageBegin();
        const location = new ServiceLocation();
        location.read(prot);
        prot.readMessageEnd();

        return location;
    }

    private getServiceAt<T>(location: ServiceLocation, serviceType: Thrift.TClientConstructor<T>): Promise<ThriftClient<T>> {
        const options: Thrift.ConnectOptions = {
            transport: location.transport === 0 ? Thrift.TBufferedTransport : Thrift.TFramedTransport,
            protocol: location.protocol === 0 ? Thrift.TBinaryProtocol : Thrift.TJSONProtocol,
        };
        return new Promise((resolve, reject) => {
            const conn = Thrift.createConnection(location.host, location.port, options)
                .on("error", err => reject(err))
                .on("connect", async () => {
                    const client = Thrift.createClient<T>(serviceType, conn);
                    resolve(new ThriftClient(conn, client));
                });
        });
    }

}

export namespace ThriftServiceManager {
    let output: Vscode.OutputChannel | undefined;

    /**
     * Readies a service registry/manager and waits for it to finish starting before returning.
     * @param workbench The workbench to use
     */
    export async function fromWorkbench(workbench: Workbench): Promise<ThriftServiceManager> {
        let registryPath = path.join(workbench.path.toString(), "common/bin/IarServiceLauncher");
        if (OsUtils.OsType.Windows === OsUtils.detectOsType()) {
            registryPath += ".exe";
        }
        // for now needs to load projectmanager at launch, otherwise it seems to behave strangely
        const projectManagerManifestPath = path.join(workbench.path.toString(), "common/bin/projectmanager.json");
        const tmpDir = getTmpDir(workbench);
        const serviceRegistryProcess = spawn(registryPath, ["-standalone", "-sockets", projectManagerManifestPath],
                                                { cwd: tmpDir });

        if (!output) { output = Vscode.window.createOutputChannel("IarServiceManager"); }
        serviceRegistryProcess.stdout.on("data", data => {
            output?.append(data.toString());
        });

        try {
            await waitUntilReady(serviceRegistryProcess);
            return new ThriftServiceManager(path.join(tmpDir, "CSpyServer2-ServiceRegistry.txt"));
        } catch(e) {
            serviceRegistryProcess.kill();
            throw e;
        }
    }

    function waitUntilReady(process: ChildProcess): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let output: string = "";
            const onData = (data: Buffer | string) => {
                output += data;
                if (output.includes("Entering main loop...")) {
                    process.stdout.removeListener("data", onData);
                    resolve();
                }
            }
            process.stdout.on("data", onData);
            
            setTimeout(() => reject("Service registry launch timed out"), 1000);
        });
    }

    // Creates and returns a temporary directory unique to the currently opened folder & workbench.
    // This is used to store the bootstrap files created by IarServiceLauncher, to avoid conflicts if
    // several service launcher processes are run at the same time.
    function getTmpDir(workbench: Workbench): string {
        const folders = Vscode.workspace.workspaceFolders;
        let openedFolder = "";
        if (folders && folders.length > 0) {
            openedFolder = folders[0].uri.fsPath;
        }
        const hashed = createHash("md5").update(openedFolder + workbench.path).digest("hex");
        const tmpPath = path.join(tmpdir(), "iar-vsc-" + hashed);
        if (!fs.existsSync(tmpPath)) {
            fs.mkdirSync(tmpPath);
        }
        return tmpPath;
    }

}