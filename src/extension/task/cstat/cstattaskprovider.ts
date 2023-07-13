/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as Vscode from "vscode";
import { CStatTaskExecution } from "./cstattaskexecution";

export namespace CStatTaskProvider {
    // These are useful to have exported to run tasks programmatically
    export enum TaskNames {
        Run = "Run C-STAT Analysis",
        Clear = "Clear C-STAT Diagnostics",
        FullReport = "Generate Full HTML Report",
        SummaryReport = "Generate HTML Summary",
    }

    let taskProvider: Vscode.Disposable | undefined = undefined;

    export function register(context: Vscode.ExtensionContext) {
        if (!taskProvider) {
            taskProvider = Vscode.tasks.registerTaskProvider("iar-cstat", new CStatProvider(context));
        }
    }

    export function unRegister() {
        if (taskProvider) {
            taskProvider.dispose();
            taskProvider = undefined;
        }
    }
}

export interface CStatTaskDefinition {
    label: string;
    type: string;
    action: "run" | "clear" | "report-full" | "report-summary";
    toolchain: string;
    project: string;
    config: string;
    argumentVariablesFile: string | undefined;
    extraBuildArguments: string[] | undefined;
}

/**
 * Tells vs code what C-STAT tasks are available, helps resolve missing values from task definitions,
 * and defines how to start C-STAT tasks. Also handles a diagnostics collection which all C-STAT tasks
 * push their results to.
 */
class CStatProvider implements Vscode.TaskProvider {
    // shared by all cstat tasks
    private readonly diagnosticsCollection: Vscode.DiagnosticCollection;
    private readonly extensionRootPath: string;

    constructor(context: Vscode.ExtensionContext) {
        this.diagnosticsCollection = Vscode.languages.createDiagnosticCollection("C-STAT");
        this.extensionRootPath = context.extensionPath;
    }

    provideTasks(): Vscode.ProviderResult<Vscode.Task[]> {
        const tasks: Vscode.Task[] = [];
        const taskVariants: Array<[string, "run" | "clear" | "report-full" | "report-summary"]> =
            [
                [CStatTaskProvider.TaskNames.Run, "run"],
                [CStatTaskProvider.TaskNames.Clear, "clear"],
                [CStatTaskProvider.TaskNames.FullReport, "report-full"],
                [CStatTaskProvider.TaskNames.SummaryReport, "report-summary"],
            ];
        for (const [label, action] of taskVariants) {
            const definition = this.getDefaultTaskDefinition(label, action);
            const execution = this.getExecution();
            const task = new Vscode.Task(definition, Vscode.TaskScope.Workspace, label, "iar-cstat", execution, []);
            tasks.push(task);
        }
        return tasks;
    }

    resolveTask(_task: Vscode.Task): Vscode.ProviderResult<Vscode.Task> {
        const action = _task.definition["action"];
        const label = _task.definition["label"];

        if (!action) {
            this.showErrorMissingField("action", label);
            return undefined;
        } else if (!["run", "clear", "report-full", "report-summary"].includes(action)) {
            return undefined;
        }

        if (!label) {
            this.showErrorMissingField("label", label);
            return undefined;
        }

        try {
            const execution = this.getExecution();
            return new Vscode.Task(_task.definition, Vscode.TaskScope.Workspace, _task.definition["label"], "iar-cstat", execution, []);
        } catch (e) {
            if (e instanceof Error) {
                Vscode.window.showErrorMessage(e.message);
            }
            return undefined;
        }
    }

    private getDefaultTaskDefinition(label: string, action: "run" | "clear" | "report-full" | "report-summary"): CStatTaskDefinition {
        const definition: CStatTaskDefinition = {
            label: label,
            type: "iar-cstat",
            action: action,
            toolchain: "${command:iar-config.toolchain}",
            project: "${command:iar-config.project-file}",
            config: "${command:iar-config.project-configuration}",
            argumentVariablesFile: "${command:iar-config.workspace-file}",
            extraBuildArguments: undefined,
        };
        return definition;
    }

    // Creates a custom task execution. VS Code will provide a task definition with e.g. command variables resolved
    private getExecution(): Vscode.CustomExecution {
        return new Vscode.CustomExecution(resolvedDefinition => {
            return Promise.resolve(
                new CStatTaskExecution(this.extensionRootPath, this.diagnosticsCollection, resolvedDefinition)
            );
        });
    }

    private showErrorMissingField(field: string, label: string): void {
        Vscode.window.showErrorMessage(`'${field}' is missing for task with label '${label}'.`);
    }
}
