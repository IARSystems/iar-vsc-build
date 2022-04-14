/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as Vscode from "vscode";
import { FilesNode } from "../../ui/treeprojectprovider";
import { ExtensionState } from "../../extensionstate";
import { ExtendedProject } from "../../../iar/project/project";

/**
 * Base class for commands that are called as context buttons from the {@link TreeProjectView} (where files and configs are managed).
 */
export abstract class ProjectCommand {

    constructor(public command: string) {
    }

    register(context: Vscode.ExtensionContext): void {
        const cmd = Vscode.commands.registerCommand(this.command, async(source): Promise<void> => {
            const proj = await ExtensionState.getInstance().extendedProject.getValue();
            if (proj === undefined) {
                return;
            }

            return this.execute(source, proj);
        }, this);

        context.subscriptions.push(cmd);
    }

    /**
     * Called to run the command
     * @param source The item in the tree view that was clicked to spawn this command
     */
    abstract execute(source: FilesNode | undefined, project: ExtendedProject): void | Promise<void>;
}