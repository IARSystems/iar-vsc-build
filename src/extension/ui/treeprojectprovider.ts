/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */



import * as Vscode from "vscode";
import { Node, NodeType } from "iar-vsc-common/thrift/bindings/projectmanager_types";
import { ExtendedProject, Project } from "../../iar/project/project";
import { BehaviorSubject } from "rxjs";
import { ExtensionSettings } from "../settings/extensionsettings";
import { logger } from "iar-vsc-common/logger";
import { ErrorUtils } from "../../utils/utils";
import { Config } from "../../iar/project/config";

// A node showing a file or file group i.e. a {@link Node}
export class FilesNode {
    public name: string;
    constructor(public iarNode: Node, public parent: FilesNode | undefined, public indexPath: number[]) {
        this.name = iarNode.name;
    }

    getChildren(): FilesNode[] {
        return this.iarNode.children.map((child, i) => new FilesNode(child, this, this.indexPath.concat([i])));
    }
}

/**
 * Provider for a tree of all files/groups in the project.
 */
export class TreeProjectProvider implements Vscode.TreeDataProvider<FilesNode> {
    readonly isEmpty = new BehaviorSubject<boolean>(false);

    private readonly _onDidChangeTreeData = new Vscode.EventEmitter<FilesNode | undefined>();
    readonly onDidChangeTreeData: Vscode.Event<FilesNode | undefined> = this._onDidChangeTreeData.event;

    private project: ExtendedProject | undefined = undefined;
    private config: Config | undefined = undefined;
    private rootNode: Node | undefined;
    private readonly projectChangeHandler = this.updateData.bind(this);

    public async setProjectAndConfig(project: ExtendedProject | undefined, config: Config | undefined) {
        this.project?.removeOnChangeListener(this.projectChangeHandler);
        this.project = project;
        this.config = config;
        if (project) {
            project.addOnChangeListener(this.projectChangeHandler);
            await this.updateData();
        } else {
            this.rootNode = undefined;
            this._onDidChangeTreeData.fire(undefined);
        }
    }
    public async setProjectConfig(config: Config | undefined) {
        this.config = config;
        if (this.project) {
            await this.updateData();
        }
    }

    public async forceUpdate() {
        await this.updateData();
    }

    public isActiveProject(other: Project): boolean {
        return other === this.project;
    }

    /// overriden functions, create the actual tree

    getTreeItem(element: FilesNode): Vscode.TreeItem | Thenable<Vscode.TreeItem> {
        const item = new Vscode.TreeItem(element.name);

        if (element.iarNode.type === NodeType.File || element.iarNode.type === NodeType.ControlFile) {
            item.iconPath = Vscode.ThemeIcon.File;
            item.command = { title: "Open in editor", command: "vscode.open", arguments: [Vscode.Uri.file(element.iarNode.path)] };
            item.contextValue = "file";
            item.resourceUri = Vscode.Uri.file(element.iarNode.path);
        }
        if (element.iarNode.type === NodeType.Group) {
            item.iconPath = Vscode.ThemeIcon.Folder;
            item.contextValue = "group";
        }
        if (element.iarNode.isGenerated) {
            item.contextValue = undefined;
        }

        if (element.iarNode.children.length === 0) {
            item.collapsibleState = Vscode.TreeItemCollapsibleState.None;
        } else {
            if (element.iarNode.isGenerated || element.iarNode.type === NodeType.File) {
                item.collapsibleState = Vscode.TreeItemCollapsibleState.Collapsed;
            } else {
                // This is a regular group, check how the user wants them handled
                item.collapsibleState = ExtensionSettings.getAutoExpandFileTree() ?
                    Vscode.TreeItemCollapsibleState.Expanded :
                    Vscode.TreeItemCollapsibleState.Collapsed;
            }
        }

        return item;
    }

    getChildren(element?: FilesNode): Vscode.ProviderResult<FilesNode[]> {
        if (!element) {
            return this.rootNode ? new FilesNode(this.rootNode, undefined, []).getChildren() : [];
        } else if (element instanceof FilesNode) {
            return element.getChildren();
        }
        return [];
    }

    private async updateData() {
        if (!this.project) {
            return;
        }
        try {
            this.rootNode = await this.project.getRootNode(this.config);
            this.isEmpty.next(this.rootNode.children.length === 0);
        } catch (e) {
            logger.error("Failed to fetch root node: " + ErrorUtils.toErrorMessage(e));
            this.rootNode = undefined;
        }
        this._onDidChangeTreeData.fire(undefined);
    }

}