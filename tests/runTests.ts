/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {runTestsIn} from "iar-vsc-common/testutils/testRunner";
import * as path from "path";
import { VscodeTestsSetup } from "./vscodeTests/setup";

async function main() {
    const cmdlineEnvs = getEnvs();

    await runTestsIn(path.resolve(__dirname), "../..", "./unitTests/index", cmdlineEnvs);
    await runTestsIn(path.resolve(__dirname), "../..", "./integrationTests/index", cmdlineEnvs);
    // A temp workspace ("sandbox") needs to be set up _before_ we launch vscode,
    // so that the projects are detected correctly
    const workspaceDir = VscodeTestsSetup.setup();
    await runTestsIn(path.resolve(__dirname), "../..", "./vscodeTests/index", cmdlineEnvs, workspaceDir);
    await runTestsIn(path.resolve(__dirname), "../..", "./miscTests/index", cmdlineEnvs);
}

/**
 * Construct a key:string based on the supplied options from the commandline.
 * @returns
 */
function getEnvs(): Record<string, string> {
    const envs: Record<string, string> = {};
    for (const opt of process.argv.slice(2)) {
        if (opt.startsWith("--")) {
            const separatorIdx = opt.indexOf("=");
            if (separatorIdx === -1) {
                const optName = opt.substring(2);
                envs[optName] = "true";
            } else {
                const optName = opt.substring(2, separatorIdx);
                const val = opt.substring(separatorIdx + 1);
                envs[optName] = val;
            }
        }
    }
    return envs;
}

main();
