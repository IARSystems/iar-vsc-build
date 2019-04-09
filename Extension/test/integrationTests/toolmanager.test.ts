/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Settings } from "../../src/extension/settings";
import { ToolManager } from "../../src/iar/tools/manager";

suite("Test toolmanager creation with filesystem", () => {
    test("Using real filesystem", () => {
        /* For now not really much of testing, just try to fetch all data from
           the local filesystem and print the result. To improve this we have to
           create something like a filesystem simulator using stubbing, but that
           is a lot of work for now. */
        let manager = ToolManager.createIarToolManager();
        Settings.getIarInstallDirectories().forEach(directory => {
            manager.collectFrom(directory);
        });

        console.log(manager);
        console.log(manager.findWorkbenchesContainingPlatform("arm"));
        console.log(manager.findWorkbenchesContainingCompiler("iccavr.exe"));
    });
});
