/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */



import * as Vscode from "vscode";
import * as Fs from "fs";
import * as Path from "path";

export namespace Settings {

    export enum ExtensionSettingsField {
        Defines = "defines",
        ExtraBuildArguments = "extraBuildArguments",
        IarInstallDirectories = "iarInstallDirectories",
        CstatFilterLevel = "c-stat.filterLevel",
        CstatDisplayLowSeverityWarningsAsHints = "c-stat.displayLowSeverityWarningsAsHints",
        CstatAutoOpenReports = "c-stat.autoOpenReports",
        CstatShowInToolbar = "c-stat.showInToolbar",
        ColorizeBuildOutput = "colorizeBuildOutput",
        ProjectsToExclude = "projectsToExclude",
        BuildOutputLogLevel = "buildOutputLogLevel",
    }

    export enum LocalSettingsField {
        Workbench = "toolchain",
        Workspace = "eww",
        Ewp = "ewp",
        Configuration = "configuration",
        ArgVarFile = "argumentVariablesFile"
    }
    /** Local settings field that are paths, and should support ${workspaceFolder} expansion */
    const localSettingsPathFields = [LocalSettingsField.Workbench, LocalSettingsField.Workspace,
        LocalSettingsField.Ewp, LocalSettingsField.ArgVarFile];

    const section = "iar-build";

    let settingsFile: LocalSettingsFile | undefined = undefined;

    export function observeSetting(field: ExtensionSettingsField, callback: () => void): void {
        Vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(section + "." + field.toString())) {
                callback();
            }
        });
    }

    export function getIarInstallDirectories(): string[] {
        const directories = Vscode.workspace.getConfiguration(section).get(ExtensionSettingsField.IarInstallDirectories);
        return (directories ?? []) as string[];
    }
    export function setIarInstallDirectories(installDirs: Fs.PathLike[]): Thenable<void> {
        return Vscode.workspace.getConfiguration(section).update(ExtensionSettingsField.IarInstallDirectories, installDirs, true);
    }

    export function getLocalSetting(field: LocalSettingsField): string | undefined {
        let value = getSettingsFile()?.get(field);
        if (localSettingsPathFields.includes(field) && value) {
            value = resolvePath(value);
        }
        return value;
    }

    export function setLocalSetting(field: LocalSettingsField, value: string) {
        if (localSettingsPathFields.includes(field) && value) {
            value = encodePath(value);
        }
        getSettingsFile()?.set(field, value);
    }

    export function getWorkbench(): string | undefined {
        return getLocalSetting(LocalSettingsField.Workbench);
    }
    export function setWorkbench(path: Fs.PathLike) {
        setLocalSetting(LocalSettingsField.Workbench, path.toString());
    }
    export function getWorkspace(): string | undefined {
        return getLocalSetting(LocalSettingsField.Workspace);
    }
    export function setWorkspace(path: Fs.PathLike) {
        setLocalSetting(LocalSettingsField.Workspace, path.toString());
    }
    export function getEwpFile(): string | undefined {
        return getLocalSetting(LocalSettingsField.Ewp);
    }
    export function setEwpFile(path: Fs.PathLike) {
        setLocalSetting(LocalSettingsField.Ewp, path.toString());
    }
    export function getConfiguration(): string | undefined {
        return getLocalSetting(LocalSettingsField.Configuration);
    }
    export function setConfiguration(name: string) {
        setLocalSetting(LocalSettingsField.Configuration, name);
    }

    export function getDefines(): string[] {
        const defines = Vscode.workspace.getConfiguration(section).get(ExtensionSettingsField.Defines);

        if (defines) {
            return defines as string[];
        } else {
            return [];
        }
    }

    export function getExtraBuildArguments(): Array<string> {
        const args = Vscode.workspace.getConfiguration(section).get(ExtensionSettingsField.ExtraBuildArguments);
        if (args) {
            return args as string[];
        } else {
            return [];
        }
    }

    export function getCstatFilterLevel(): "Low" | "Medium" | "High" {
        const lvl = Vscode.workspace.getConfiguration(section).get<string>(ExtensionSettingsField.CstatFilterLevel);
        if (lvl === "Low" || lvl === "Medium" || lvl === "High") {
            return lvl;
        }
        return "Low";
    }
    export function getCstatDisplayLowSeverityWarningsAsHints(): boolean {
        const val = Vscode.workspace.getConfiguration(section).get<boolean>(ExtensionSettingsField.CstatDisplayLowSeverityWarningsAsHints);
        return val ?? false;
    }
    export function getCstatAutoOpenReports(): boolean {
        const val = Vscode.workspace.getConfiguration(section).get<boolean>(ExtensionSettingsField.CstatAutoOpenReports);
        return val ?? false;
    }
    export function getCstatShowInToolbar(): boolean {
        const val = Vscode.workspace.getConfiguration(section).get<boolean>(ExtensionSettingsField.CstatShowInToolbar);
        return val ?? true;
    }
    export function setCstatShowInToolbar(value:  boolean) {
        Vscode.workspace.getConfiguration(section).update(ExtensionSettingsField.CstatShowInToolbar, value);
    }
    export function getColorizeBuildOutput(): boolean {
        const val = Vscode.workspace.getConfiguration(section).get<boolean>(ExtensionSettingsField.ColorizeBuildOutput);
        return val ?? false;
    }
    export function getProjectsToExclude(): string | undefined {
        return Vscode.workspace.getConfiguration(section).get<string>(ExtensionSettingsField.ProjectsToExclude);
    }
    export function getBuildOutputLogLevel(): "all" | "info" | "warnings" | "errors" {
        // we map the user-facing "pretty" values to the iarbuild parameter equivalents
        const lvl = Vscode.workspace.getConfiguration(section).get<string>(ExtensionSettingsField.BuildOutputLogLevel);
        if (lvl === undefined) {
            return "info";
        }
        const map: Record<string, ReturnType<typeof getBuildOutputLogLevel>> = {
            "All": "all",
            "Messages": "info",
            "Warnings": "warnings",
            "Errors": "errors",
        };
        return map[lvl] ?? "info";
    }

    function generateSettingsFilePath(): Fs.PathLike | undefined  {
        const folders = Vscode.workspace.workspaceFolders;
        if (folders !== undefined && folders[0] !== undefined) {
            const folder = folders[0].uri.fsPath;
            return Path.join(folder, ".vscode", "iar-vsc.json");
        }
        return undefined;
    }

    function getSettingsFile(): LocalSettingsFile | undefined {
        if (settingsFile === undefined) {
            const path = generateSettingsFilePath();
            if (path !== undefined) {
                settingsFile = new LocalSettingsFile(path);
            }
        }

        return settingsFile;
    }

    function resolvePath(path: string): string {
        const folders = Vscode.workspace.workspaceFolders;
        if (folders !== undefined && folders[0] !== undefined) {
            path = path.replace("${workspaceFolder}", folders[0].uri.fsPath);
        }
        return path;
    }
    function encodePath(path: string): string {
        const folders = Vscode.workspace.workspaceFolders;
        if (folders !== undefined && folders[0] !== undefined) {
            const wsRelativePath = Path.relative(folders[0].uri.fsPath, path);
            if (!wsRelativePath.startsWith("..") && !Path.isAbsolute(wsRelativePath)) {
                return Path.join("${workspaceFolder}", wsRelativePath);
            }
        }
        return path;
    }
}

interface LocalSettings {
    toolchain?: string;
    eww?: string;
    ewp?: string;
    configuration?: string;
    argumentVariablesFile?: string;
}

/**
 * The settings file which stores the currently selected workbench/project etc in a workspace.
 */
class LocalSettingsFile {
    private readonly path_: Fs.PathLike;
    private json_: LocalSettings;

    constructor(path: Fs.PathLike) {
        this.path_ = path;
        this.json_ = LocalSettingsFile.loadFile(this.path);
    }

    get path(): Fs.PathLike {
        return this.path_;
    }

    public get(field: Settings.LocalSettingsField): string | undefined {
        if (field in this.json_) {
            return this.json_[field];
        } else {
            return undefined;
        }
    }

    public set(field: Settings.LocalSettingsField, value: string): void {
        this.json_[field] = value;
        this.save();
    }

    public remove(field: Settings.LocalSettingsField): void {
        if (field in this.json_) {
            delete this.json_[field];
            this.save();
        }
    }

    private save(): void {
        const dirname = Path.parse(this.path.toString()).dir;

        if (!Fs.existsSync(dirname)) {
            Fs.mkdirSync(dirname);
        }

        Fs.writeFileSync(this.path, JSON.stringify(this.json_, undefined, 4));
    }

    private static loadFile(path: Fs.PathLike): LocalSettings  {
        if (!Fs.existsSync(path)) {
            return {};
        } else {
            try {
                const content = Fs.readFileSync(path);

                return JSON.parse(content.toString());
            } catch (_) {
                return {};
            }
        }
    }
}