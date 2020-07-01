/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';


import * as vscode from 'vscode';
import { UI } from './extension/ui/app';
import { ToolManager } from './iar/tools/manager';
import { Settings } from './extension/settings';
import { SettingsMonitor } from './extension/settingsmonitor';
import { IarTaskProvider } from './extension/task/provider';
import { GetSettingsCommand } from "./extension/command/getsettings";
import { Logging } from './utils/logging';
import { IarConfigurationProvider } from './extension/configprovider/configurationprovider';
import { CStatTaskProvider } from './extension/task/cstat/cstattaskprovider';
import { BuildTaskProvider } from './extension/task/thriftbuild/buildtaskprovider';

export async function activate(context: vscode.ExtensionContext) {
    Logging.setup(context);

    GetSettingsCommand.initCommands(context);
    UI.init(context, IarVsc.toolManager);

    SettingsMonitor.monitorWorkbench(UI.getInstance().workbench.model);
    SettingsMonitor.monitorCompiler(UI.getInstance().compiler.model);
    SettingsMonitor.monitorProject(UI.getInstance().project.model);
    SettingsMonitor.monitorConfiguration(UI.getInstance().config.model);
    UI.getInstance().show();

    loadTools();
    Settings.observeSetting(Settings.Field.IarInstallDirectories, loadTools);

    vscode.commands.registerCommand("iar.addNode", () => vscode.window.showInformationMessage(":)"));
    vscode.commands.registerCommand("iar.removeNode", async (node: Node) => {
        console.log(node)
        const res = await vscode.window.showInputBox({ prompt: "Really remove 'src.c'? Type 'yes' to confirm." });
        // const res = await vscode.window.showQuickPick(["Cancel", "Remove (irreversible!)"]);
        if (res === "yes") {
            vscode.window.showInformationMessage("The node has been removed from the project.");
        }
    });
    vscode.commands.registerCommand("iar.createProject", () => vscode.window.showInputBox({ prompt: "Enter a name for the new project.", placeHolder: "my_project.ewp" }));
    vscode.commands.registerCommand("iar.createConfig", () => vscode.window.showInputBox({ prompt: "Enter a name for the new configuration.", placeHolder: "MyConfiguration" }));
    vscode.commands.registerCommand("iar.removeConfig", async (node: Node) => {
        console.log(node)
        const res = await vscode.window.showInputBox({ prompt: "Really remove the configuration 'Debug'? Type 'yes' to confirm." });
        if (res === "yes") {
            vscode.window.showInformationMessage("The configuration has been removed from the project.");
        }
    });

    IarConfigurationProvider.init();
    IarTaskProvider.register();
    BuildTaskProvider.register();
    CStatTaskProvider.register(context);
}

export function deactivate() {
    if (IarConfigurationProvider.instance) {
        IarConfigurationProvider.instance.dispose();
    }
    IarTaskProvider.unregister();
    CStatTaskProvider.unRegister();
}

function loadTools() {
    let roots = Settings.getIarInstallDirectories();

    roots.forEach(path => {
        IarVsc.toolManager.collectFrom(path);
    });

    if (IarVsc.toolManager.workbenches.length === 0) {
        vscode.window.showErrorMessage("IAR: Unable to find any IAR workbenches to use, you will need to configure this to use the extension (see [the documentation](https://iar-vsc.readthedocs.io/en/latest/pages/user_guide.html#extension-settings))");
    }

}

namespace IarVsc {
    export let toolManager = ToolManager.createIarToolManager();
}
