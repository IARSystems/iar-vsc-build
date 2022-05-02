/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { ExtensionState } from "../../extensionstate";
import { CommandBase } from "../command";

export class ReloadProjectCommand extends CommandBase<Promise<void>> {

    constructor() {
        super("iar.reloadProject");
    }

    async executeImpl(_autoTriggered?: boolean): Promise<void> {
        await ExtensionState.getInstance().reloadProject();
    }
}