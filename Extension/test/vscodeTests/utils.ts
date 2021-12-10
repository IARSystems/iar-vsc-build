import * as Assert from "assert";
import * as Vscode from "vscode";
import { UI } from "../../src/extension/ui/app";

export namespace VscodeTestsUtils {

    // Waits for the extension to be activated.
    export async function ensureExtensionIsActivated() {
        const ext = Vscode.extensions.getExtension("pluyckx.iar-vsc");
        Assert(ext, "Extension is not installed, did its name change?");
        await ext?.activate();
    }

    // ---- Helpers for interacting with the extension configuration UI

    // Tags for working with the Iar GUI integration
    export const EW = "EW Installation";
    export const PROJECT = "Project";
    export const CONFIG = "Configuration";

    export function assertNodelistContains(treeItems: Vscode.ProviderResult<Vscode.TreeItem[]>, labelToFind: string ) {
        if (Array.isArray(treeItems)) {
            return treeItems.find(item => {
                return item.label?.toString().startsWith(labelToFind);
            });
        }
        Assert.fail("Failed to locate item with label: " + labelToFind);
    }

    export function getEntries(topNodeName: string) {
        const theTree = UI.getInstance().settingsTreeView;
        const nodes = theTree.getChildren();
        if (Array.isArray(nodes)) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i]!.label === topNodeName) {
                    return theTree.getChildren(nodes[i]);
                }
            }
        }
        Assert.fail("Failed to locate: " + topNodeName);
    }
    export function activateSomething(entryLabel: string, toActivate: string) {
        const list = getEntries(entryLabel);
        const listEntry = assertNodelistContains(list, toActivate);

        Assert(listEntry && listEntry.command && listEntry.command.arguments);
        return Vscode.commands.executeCommand(listEntry.command.command, listEntry.command.arguments[0]);
    }

    export async function activateProject(projectLabel: string) {
        if (UI.getInstance().project.model.selected?.name !== projectLabel) {
            await Promise.all([
                // Ensure the project has loaded and the configuration list belongs to the new project
                VscodeTestsUtils.configurationChanged(),
                activateSomething(PROJECT, projectLabel),
            ]);
        }
    }

    export function activateConfiguration(configurationTag: string) {
        return activateSomething(CONFIG, configurationTag);
    }

    export function activateWorkbench(ew: string) {
        return activateSomething(EW, ew);
    }

    // Waits until the configuration model changes. Useful e.g. after activating a project to ensure it has loaded completely.
    export function configurationChanged() {
        return new Promise<void>((resolve, reject) => {
            let resolved = false;
            UI.getInstance().config.model.addOnSelectedHandler(config => {
                if (config !== undefined && !resolved) {
                    resolved = true;
                    resolve();
                }
            });
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error("Timed out waiting for configuration to change. Did the project never load?"));
                }
            }, 30000);
        });
    }

    // ---- Helpers for running tasks

    /**
     * Execute a task and return a promise to keep track of the completion. The promise is resolved when
     * the matcher returns true.
     * @param task
     * @param matcher
     * @returns
     */
     export async function executeTask(task: Vscode.Task, matcher: (taskEvent: Vscode.TaskEndEvent) => boolean) {
         await Vscode.tasks.executeTask(task);

         return new Promise<void>(resolve => {
             const disposable = Vscode.tasks.onDidEndTask(e => {
                 if (matcher(e)) {
                     disposable.dispose();
                     resolve();
                 }
             });
         });
     }

    /**
     * Run a task with the given name for the a project and configuration. Returns a promise that resolves
     * once the task has been executed.
     * @param taskName
     * @param projectName
     * @param configuration
     * @returns
     */
    export async function runTaskForProject(taskName: string, projectName: string, configuration: string) {
        // To have the call to vscode.tasks working the activate calls needs to be awaited.
        await activateProject(projectName);
        await activateConfiguration(configuration);

        // Fetch the tasks and execute the build task.
        return Vscode.tasks.fetchTasks().then(async(listedTasks) => {
            // Locate the right task
            const theTask = listedTasks.find((task) => {
                return task.name === taskName;
            });
            Assert(theTask, "Failed to locate " + taskName);

            // Execute the task and wait for it to complete
            await executeTask(theTask, (e) => {
                return e.execution.task.name === taskName;
            });
        }, (reason) => {
            Assert.fail(reason);
        });
    }
}