// TODO: remove this comment once VSC-5 has been closed, it should remove all any:s in this file
/* eslint-disable @typescript-eslint/no-explicit-any */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */



import * as Vscode from "vscode";
import { isArray } from "util";
import { IarExecution } from "./iarexecution";
import { OsUtils } from "../../utils/utils";
import { IarOsUtils } from "../../../utils/osUtils";

export interface OpenTaskDefinition {
    readonly label: string;
    readonly type: string;
    readonly command: string;
    readonly workbench: string;
    readonly workspace: string;
}

export namespace OpenTasks {
    export function generateTasks(dstMap: Map<string, Vscode.Task>): void {
        if (dstMap.get("Iar Open") === undefined) {
            if (OsUtils.OsType.Windows !== OsUtils.detectOsType()) {
                return; // We can only perform open tasks on Windows
            }

            const task = generateTask("Iar Open");

            if (!task) {
                showErrorFailedToCreateDefaultTask("Iar Open", "open");
            } else {
                dstMap.set("Iar Open", task);
            }
        }
    }

    export function generateFromDefinition(definition: Vscode.TaskDefinition): Vscode.Task | undefined {
        const command = definition["command"];
        const workspace = definition["workspace"];
        const label = definition["label"];
        const workbench = definition["workbench"];

        if (command === undefined) {
            showErrorMissingField("command", label);
            return undefined;
        } else if (command !== "open") {
            return undefined;
        }

        if (workspace === undefined) {
            showErrorMissingField("workspace", label);
            return undefined;
        }

        if (label === undefined) {
            showErrorMissingField("label", label);
            return undefined;
        }

        if (workbench === undefined) {
            showErrorMissingField("workbench", label);
            return undefined;
        }

        const process = new IarExecution(
            workbench,
            [
                workspace
            ]
        );

        const task: Vscode.Task = new Vscode.Task(definition, Vscode.TaskScope.Workspace, label, "iar", process);

        if (definition["problemMatcher"] !== undefined) {
            task.problemMatchers = definition["problemMatcher"];
        }
        return task;
    }

    export function generateFromTasksJson(json: any, dst: Map<string, Vscode.Task>): void {
        const tasks: any = json["tasks"];
        let tasksAsArray: Array<any>;

        if ((tasks === undefined) || !isArray(tasks)) {
            return;
        } else {
            tasksAsArray = tasks as Array<any>;
        }

        tasksAsArray.forEach(taskDefinition => {
            if (taskDefinition["type"] === "iar") {
                const task = generateFromDefinition(taskDefinition);

                if (task) {
                    dst.set(taskDefinition["label"], task);
                }
            }
        });
    }

    function generateTask(label: string): Vscode.Task | undefined {
        const definition = {
            label: label,
            type: "iar",
            command: "open",
            workbench: "${command:iar-settings.workbench}/common/bin/IarIdePm" + IarOsUtils.executableExtension(),
            workspace: "${command:iar.selectIarWorkspace}",
            problemMatcher: []
        };

        return generateFromDefinition(definition);
    }

    function showErrorMissingField(field: string, label: string): void {
        Vscode.window.showErrorMessage(`'${field}' is missing for task with label '${label}'.`);
    }

    function showErrorFailedToCreateDefaultTask(label: string, command: string): void {
        Vscode.window.showErrorMessage(`Failed to create task '${label}' with command ${command}.`);
    }
}
