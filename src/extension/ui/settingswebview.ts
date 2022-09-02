/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as vscode from "vscode";
import { Config } from "../../iar/project/config";
import { Project } from "../../iar/project/project";
import { Workbench } from "iar-vsc-common/workbench";
import { ListInputModel } from "../model/model";
import * as sanitizeHtml from "sanitize-html";
import { AddWorkbenchCommand } from "../command/addworkbench";
import { logger } from "iar-vsc-common/logger";
import { Subject } from "rxjs";
import { ArgVarsFile } from "../../iar/project/argvarfile";

// Make sure this matches the enum in media/settingsview.js! AFAIK we cannot share code between here and the webview javascript
enum MessageSubject {
    WorkbenchSelected = "Workbench",
    ProjectSelected = "Project",
    ConfigSelected = "Config",
    ArgVarsSelected = "ArgVars",
    AddWorkbench = "AddWorkbench",
    OpenSettings = "OpenSettings",
}
export enum DropdownIds {
    Workbench = "workbench",
    Project = "project",
    Configuration = "config",
    ArgVarsFile = "argvarsfile",
}

/**
 * A webview in the side panel that lets the user select which workbench, project and configuration to use.
 * The view is constructed using plain html, css and js which run separate from all extension code. The view uses
 * a message-passing system to inform the extension of e.g. the user selecting a new value.
 * For documentation on webviews, see here:
 * https://code.visualstudio.com/api/extension-guides/webview
 */
export class SettingsWebview implements vscode.WebviewViewProvider {

    public static readonly VIEW_TYPE = "iar-configuration";

    private view?: vscode.WebviewView;
    private workbenchesLoading = false;

    /**
     * Creates a new view. The caller is responsible for registering it.
     * @param extensionUri The uri of the extension's root directory
     * @param workbenches The workbench list to display and modify
     * @param projects The project list to display and modify
     * @param configs The configuration list to display and modify
     * @param argVarFiles The .custom_argvars file list to display and modify
     * @param addWorkbenchCommand The command to call when the user wants to add a new workbench
     * @param workbenchesLoading Notifies when the workbench list is in the process of (re)loading
     */
    constructor(private readonly extensionUri: vscode.Uri,
        private readonly workbenches: ListInputModel<Workbench>,
        private readonly projects: ListInputModel<Project>,
        private readonly configs: ListInputModel<Config>,
        private readonly argVarFiles: ListInputModel<ArgVarsFile>,
        private readonly addWorkbenchCommand: AddWorkbenchCommand,
        workbenchesLoading: Subject<boolean>,
    ) {
        // Fully redraw the view on any change. Not optimal performance, but seems to be fast enough.
        const changeHandler = this.updateView.bind(this);
        this.workbenches.addOnInvalidateHandler(changeHandler);
        this.workbenches.addOnSelectedHandler(changeHandler);
        this.projects.addOnInvalidateHandler(changeHandler);
        this.projects.addOnSelectedHandler(changeHandler);
        this.configs.addOnInvalidateHandler(changeHandler);
        this.configs.addOnSelectedHandler(changeHandler);
        this.argVarFiles.addOnInvalidateHandler(changeHandler);
        this.argVarFiles.addOnSelectedHandler(changeHandler);

        workbenchesLoading.subscribe(load => {
            this.workbenchesLoading = load;
            this.updateView();
        });
    }

    // Called by vscode before the view is shown
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext<unknown>, _token: vscode.CancellationToken): void | Thenable<void> {
        this.view = webviewView;
        this.view.onDidDispose(() => {
            this.view = undefined;
        });

        this.view.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, "media"),
                vscode.Uri.joinPath(this.extensionUri, "node_modules"),
            ]
        };
        // These messages are sent by our view (media/settingsview.js)
        this.view.webview.onDidReceiveMessage(async(message: {subject: string, index: number }) => {
            logger.debug(`Message from settings view: ${JSON.stringify(message)}`);
            switch (message.subject) {
            case MessageSubject.WorkbenchSelected:
                this.workbenches.select(message.index);
                break;
            case MessageSubject.ProjectSelected:
                this.projects.select(message.index);
                break;
            case MessageSubject.ConfigSelected:
                this.configs.select(message.index);
                break;
            case MessageSubject.ArgVarsSelected:
                this.argVarFiles.select(message.index);
                break;
            case MessageSubject.AddWorkbench: {
                const changed = await vscode.commands.executeCommand(this.addWorkbenchCommand.id);
                if (!changed) {
                    // Redraw so workbench dropdown's selected value matches model
                    this.updateView();
                }
                break;
            }
            case MessageSubject.OpenSettings:
                vscode.commands.executeCommand("workbench.action.openSettings", "@ext:iarsystems.iar-build");
                break;
            default:
                logger.error("Settings view got unknown subject: " + message.subject);
                break;
            }
        });
        this.updateView();
    }

    private updateView() {
        if (this.view === undefined) {
            return;
        }
        this.view.webview.html = Rendering.getWebviewContent(this.view.webview, this.extensionUri, this.workbenches, this.projects, this.configs, this.argVarFiles, this.workbenchesLoading);
    }

    // ! Exposed for testing only. Selects a specific option from a dropdown.
    selectFromDropdown(dropdown: DropdownIds, index: number) {
        if (this.view === undefined) {
            throw new Error("View is not attached");
        }
        this.view.webview.postMessage({subject: "select", target: dropdown, index: index});
    }
}

/**
 * Generates the HTML for the view. The view itself is stateless; the contents are determined entirely from the input parameters
 * to {@link getWebviewContent}. Any UI changes (such as the user selecting another dropdown option) are immediately
 * sent to the extension so that the data model(s) can be updated, and the view is then redrawn from the updated model(s).
 */
namespace Rendering {
    let renderCount = 0;

    export function getWebviewContent(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
        workbenches: ListInputModel<Workbench>,
        projects: ListInputModel<Project>,
        configs: ListInputModel<Config>,
        argVarFiles: ListInputModel<ArgVarsFile>,
        workbenchesLoading: boolean
    ) {
        // load npm packages for standardized UI components and icons
        //! NOTE: ALL files you load here (even indirectly) must be explicitly included in .vscodeignore, so that they are packaged in the .vsix. Webpack will not find these files.
        const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "node_modules", "@vscode", "webview-ui-toolkit", "dist", "toolkit.js"));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "node_modules", "@vscode/codicons", "dist", "codicon.css"));
        // load css and js for the view (in <extension root>/media/).
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "settingsview.css"));
        const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "settingsview.js"));

        // install the es6-string-html extension for syntax highlighting here
        return /*html*/`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none';
                    font-src ${webview.cspSource};
                    img-src ${webview.cspSource};
                    frame-src ${webview.cspSource};
                    script-src ${webview.cspSource};
                    style-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="module" src="${toolkitUri}"></script>
        <link href="${codiconsUri}" rel="stylesheet" />
        <link rel="stylesheet" href="${cssUri}">
        <script src="${jsUri}"></script>
        <title>Extension Configuration</title>
    </head>
    <body>
        <!-- A hacky way to make the html different every draw, and thus force vs code to redraw the view. -->
        <!-- This lets us reset the dropdowns' selected values to match the models, by redrawing the view. -->
        <!-- ${renderCount++} -->
        <div id="contents">
            <div class="section">
                <p>IAR Embedded Workbench or IAR Build Tools installation:</p>
                ${makeDropdown(workbenches, DropdownIds.Workbench, "tools", workbenches.amount === 0 || workbenchesLoading, /*html*/`
                    <vscode-divider></vscode-divider>
                    <vscode-option artificial>Add Toolchain...</vscode-option>
                `)}
                <div id="workbench-error" ${workbenches.amount > 0 || workbenchesLoading ? "hidden" : ""}>
                    <span>No IAR toolchain installations found.</span><vscode-link id="link-add">Add Toolchain</vscode-link>
                </div>
                <vscode-progress-ring ${ !workbenchesLoading ? "hidden" : ""}></vscode-progress-ring>
            </div>
            <div class="section">
                    <p>Active Project and Configuration:</p>
                    ${makeDropdown(projects, DropdownIds.Project, "symbol-method", projects.amount === 0)}
                    ${makeDropdown(configs, DropdownIds.Configuration, "settings-gear", configs.amount === 0)}
            </div>
            <div class="section">
                    <p>Custom Argument Variables File <span class="codicon codicon-question help-icon"></span></p>
                    ${makeDropdown(argVarFiles, DropdownIds.ArgVarsFile, "variable-group", argVarFiles.amount === 0)}
            </div>
        </div>

        <div id="footer">
            <vscode-link id="settings-link" class="link">Open Settings</vscode-link>
            <vscode-link href="https://github.com/IARSystems/iar-vsc-build/blob/master/docs/README.md" id="documentation-link" class="link">View Documentation</vscode-link>
        </div>
    </body>
    </html>`;
    }

    function makeDropdown<T>(model: ListInputModel<T>, id: DropdownIds, iconName: string, isDisabled: boolean, extraOptions?: string) {
        return /*html*/`
            <div class="dropdown-container">
                <span class="codicon codicon-${iconName} dropdown-icon ${isDisabled ? "disabled" : ""}"></span>
                <vscode-dropdown id="${id}" class="dropdown" ${isDisabled ? "disabled" : ""}>
                    ${getDropdownOptions(model, "No .custom_argvars file found")}
                    ${extraOptions ?? ""}
                </vscode-dropdown>
            </div>
        `;
    }

    function getDropdownOptions<T>(model: ListInputModel<T>, emptyMsg: string): string {
        if (model.amount === 0) {
            return `<vscode-option>${emptyMsg}</vscode-option>`;
        }
        let html = "";
        if (model.selectedIndex === undefined) {
            // The 'articifical' attribute tells the ui code to disregard this when calculating selected index
            html += /*html*/`<vscode-option selected artificial>None selected...</vscode-option>`;
        }
        for (let i = 0; i < model.amount; i++) {
            // Note that we sanitize the labels, since they are user input and could inject HTML.
            html += /*html*/`<vscode-option ${model.selectedIndex === i ? "selected" : ""}>
                ${sanitizeHtml(model.label(i), {allowedTags: [], allowedAttributes: {}, disallowedTagsMode: "recursiveEscape"})}
            </vscode-option>`;
        }
        return html;
    }
}
