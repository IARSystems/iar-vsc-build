/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at https://mozilla.org/mpl/2.0/. */



import * as ProjectManager from "./project/thrift/bindings/ProjectManager";
import * as Fs from "fs";
import * as Path from "path";
import { Workbench } from "./tools/workbench";
import { Toolchain, PROJECTMANAGER_ID } from "./project/thrift/bindings/projectmanager_types";
import { ExtendedProject, Project } from "./project/project";
import { ThriftServiceManager } from "./project/thrift/thriftservicemanager";
import { ThriftClient } from "./project/thrift/thriftclient";
import { QtoPromise } from "../utils/promise";
import { ThriftProject } from "./project/thrift/thriftproject";

/**
 * A workbench with some extra capabilities,
 * such as querying for toolchains (platforms) and loading {@link ExtendedProject}s.
 */
export interface ExtendedWorkbench {
    readonly workbench: Workbench;

    getToolchains(): Promise<Toolchain[]>;

    loadProject(project: Project): Promise<ExtendedProject>;
    createProject(path: Fs.PathLike): Promise<Project>;

    dispose(): Promise<void>;
}

/**
 * A workbench thrift and a project manager service to provide extended capabilities,
 * such as querying for toolchains (platforms) and loading {@link ExtendedProject}s.
 */
export class ThriftWorkbench implements ExtendedWorkbench {
    static async from(workbench: Workbench): Promise<ThriftWorkbench> {
        const serviceManager = await ThriftServiceManager.fromWorkbench(workbench);
        const projectManager = await serviceManager.findService(PROJECTMANAGER_ID, ProjectManager);
        return new ThriftWorkbench(workbench, serviceManager, projectManager);
    }

    static hasThriftSupport(workbench: Workbench): boolean {
        // TODO: find a better way to do this
        return Fs.existsSync(Path.join(workbench.path.toString(), "common/bin/projectmanager.json"));
    }

    constructor(public workbench:   Workbench,
                private readonly serviceMgr: ThriftServiceManager,
                private readonly projectMgr: ThriftClient<ProjectManager.Client>) {
    }

    public getToolchains() {
        return QtoPromise(this.projectMgr.service.GetToolchains());
    }

    public loadProject(project: Project) {
        return ThriftProject.load(project.path, this.projectMgr.service);
    }

    public async createProject(path: Fs.PathLike) {
        if (Fs.existsSync(path)) {
            return Promise.reject(new Error(`The file '${path}' already exists.`));
        }
        const context = await this.projectMgr.service.CreateEwpFile(path.toString());
        const project = new Project(context.filename);
        await this.projectMgr.service.CloseProject(context);
        return project;
    }

    public async dispose() {
        // TODO: should we keep track of loaded projects and unload them here?
        this.projectMgr.close();
        await this.serviceMgr.stop();
    }
}