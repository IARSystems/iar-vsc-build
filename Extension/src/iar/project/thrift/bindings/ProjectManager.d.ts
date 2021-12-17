/// <reference path="HeartbeatService.d.ts" />
//
// Autogenerated by Thrift Compiler (0.14.0)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//

import thrift = require('thrift');
import Thrift = thrift.Thrift;
import Q = thrift.Q;
import Int64 = require('node-int64');
import shared_ttypes = require('./shared_types');


import ttypes = require('./projectmanager_types');
import ToolType = ttypes.ToolType
import InvocationType = ttypes.InvocationType
import NodeType = ttypes.NodeType
import OptionType = ttypes.OptionType
import PROJECTMANAGER_ID = ttypes.PROJECTMANAGER_ID
import ProjectManagerError = ttypes.ProjectManagerError
import ToolDefinition = ttypes.ToolDefinition
import Toolchain = ttypes.Toolchain
import Configuration = ttypes.Configuration
import WorkspaceContext = ttypes.WorkspaceContext
import ProjectContext = ttypes.ProjectContext
import Node = ttypes.Node
import OptionElementDescription = ttypes.OptionElementDescription
import OptionDescription = ttypes.OptionDescription
import OptionCategory = ttypes.OptionCategory
import BuildResult = ttypes.BuildResult
import HeartbeatService = require('./HeartbeatService');

/**
 * A service which manages Embedded Workbench project files (.ewp)
 * 
 * It can manipulate the project nodes and build configurations, as well as reading/writing
 * their respective settings.
 * 
 * It also holds the one and only workspace.
 * For project operations the workspace is implicit (no context parameter needed).
 * If project operations are made without creating or loading any workspace first
 * an 'anonymous' workspace is created. An 'anonymous' workspace cannot be saved.
 * 
 * There is also experimental support to register new toolchains directly from the service, without
 * requiring an swtd library. This is however very limited as of now in that there is
 * no option support for the tools in the toolchain.
 */
declare class Client extends HeartbeatService.Client {
  #output: thrift.TTransport;
  #pClass: thrift.TProtocol;
  #_seqid: number;

  constructor(output: thrift.TTransport, pClass: { new(trans: thrift.TTransport): thrift.TProtocol });

  /**
   * will be created.
   */
  CreateEwwFile(file_path: string): Q.Promise<WorkspaceContext>;

  /**
   * will be created.
   */
  CreateEwwFile(file_path: string, callback?: (error: ttypes.ProjectManagerError, response: WorkspaceContext)=>void): void;

  /**
   * Loading a workspace will automatically close any open workspace.
   */
  LoadEwwFile(file_path: string): Q.Promise<WorkspaceContext>;

  /**
   * Loading a workspace will automatically close any open workspace.
   */
  LoadEwwFile(file_path: string, callback?: (error: ttypes.ProjectManagerError, response: WorkspaceContext)=>void): void;

  /**
   * There is always only one workspace so no context is needed.
   */
  SaveEwwFile(): Q.Promise<void>;

  /**
   * There is always only one workspace so no context is needed.
   */
  SaveEwwFile(callback?: (error: ttypes.ProjectManagerError, response: void)=>void): void;

  /**
   * There is always only one workspace so no context is needed.
   */
  GetProjects(): Q.Promise<ProjectContext[]>;

  /**
   * There is always only one workspace so no context is needed.
   */
  GetProjects(callback?: (error: void, response: ProjectContext[])=>void): void;

  /**
   * Get current project.
   */
  GetCurrentProject(): Q.Promise<ProjectContext>;

  /**
   * Get current project.
   */
  GetCurrentProject(callback?: (error: ttypes.ProjectManagerError, response: ProjectContext)=>void): void;

  /**
   * This change is saved to the settings file.
   */
  SetCurrentProject(ctx: ProjectContext): Q.Promise<void>;

  /**
   * This change is saved to the settings file.
   */
  SetCurrentProject(ctx: ProjectContext, callback?: (error: ttypes.ProjectManagerError, response: void)=>void): void;

  /**
   * Close loaded workspace, freeing the resources allocated for it by the project manager.
   */
  CloseWorkspace(): Q.Promise<void>;

  /**
   * Close loaded workspace, freeing the resources allocated for it by the project manager.
   */
  CloseWorkspace(callback?: (error: ttypes.ProjectManagerError, response: void)=>void): void;

  /**
   * Create new, empty project with the provided file path
   */
  CreateEwpFile(file_path: string): Q.Promise<ProjectContext>;

  /**
   * Create new, empty project with the provided file path
   */
  CreateEwpFile(file_path: string, callback?: (error: ttypes.ProjectManagerError, response: ProjectContext)=>void): void;

  /**
   * Load project from .ewp file
   */
  LoadEwpFile(file_path: string): Q.Promise<ProjectContext>;

  /**
   * Load project from .ewp file
   */
  LoadEwpFile(file_path: string, callback?: (error: ttypes.ProjectManagerError, response: ProjectContext)=>void): void;

  /**
   * Save project to file specified in the context
   */
  SaveEwpFile(project: ProjectContext): Q.Promise<void>;

  /**
   * Save project to file specified in the context
   */
  SaveEwpFile(project: ProjectContext, callback?: (error: ttypes.ProjectManagerError, response: void)=>void): void;

  /**
   * Returns true is there is cached data that is not saved.
   */
  IsModified(project: ProjectContext): Q.Promise<boolean>;

  /**
   * Returns true is there is cached data that is not saved.
   */
  IsModified(project: ProjectContext, callback?: (error: void, response: boolean)=>void): void;

  /**
   * Get existing project context given file path
   */
  GetProject(file_path: string): Q.Promise<ProjectContext>;

  /**
   * Get existing project context given file path
   */
  GetProject(file_path: string, callback?: (error: ttypes.ProjectManagerError, response: ProjectContext)=>void): void;

  /**
   * It only has any effect on anonymous workspaces.
   */
  CloseProject(project: ProjectContext): Q.Promise<void>;

  /**
   * It only has any effect on anonymous workspaces.
   */
  CloseProject(project: ProjectContext, callback?: (error: ttypes.ProjectManagerError, response: void)=>void): void;

  /**
   * Add a Configuration to a project
   */
  AddConfiguration(config: Configuration, project: ProjectContext, isDebug: boolean): Q.Promise<void>;

  /**
   * Add a Configuration to a project
   */
  AddConfiguration(config: Configuration, project: ProjectContext, isDebug: boolean, callback?: (error: void, response: void)=>void): void;

  /**
   * Does not save the project.
   */
  AddConfigurationNoSave(project: ProjectContext, config: Configuration, basedOnName: string): Q.Promise<void>;

  /**
   * Does not save the project.
   */
  AddConfigurationNoSave(project: ProjectContext, config: Configuration, basedOnName: string, callback?: (error: void, response: void)=>void): void;

  /**
   * Remove a Configuration from a project given its name
   */
  RemoveConfiguration(configurationName: string, project: ProjectContext): Q.Promise<void>;

  /**
   * Remove a Configuration from a project given its name
   */
  RemoveConfiguration(configurationName: string, project: ProjectContext, callback?: (error: void, response: void)=>void): void;

  /**
   * Does not save the project.
   */
  RemoveConfigurationNoSave(project: ProjectContext, configurationName: string): Q.Promise<void>;

  /**
   * Does not save the project.
   */
  RemoveConfigurationNoSave(project: ProjectContext, configurationName: string, callback?: (error: void, response: void)=>void): void;

  /**
   * Get all Configurations in a project
   */
  GetConfigurations(project: ProjectContext): Q.Promise<Configuration[]>;

  /**
   * Get all Configurations in a project
   */
  GetConfigurations(project: ProjectContext, callback?: (error: void, response: Configuration[])=>void): void;

  /**
   * are put last in the order they are.
   */
  SetConfigurationsOrder(project: ProjectContext, configNames: string[]): Q.Promise<void>;

  /**
   * are put last in the order they are.
   */
  SetConfigurationsOrder(project: ProjectContext, configNames: string[], callback?: (error: void, response: void)=>void): void;

  /**
   * Get current configuration.
   */
  GetCurrentConfiguration(project: ProjectContext): Q.Promise<Configuration>;

  /**
   * Get current configuration.
   */
  GetCurrentConfiguration(project: ProjectContext, callback?: (error: ttypes.ProjectManagerError, response: Configuration)=>void): void;

  /**
   * This change is saved to the settings file.
   */
  SetCurrentConfiguration(project: ProjectContext, configurationName: string): Q.Promise<void>;

  /**
   * This change is saved to the settings file.
   */
  SetCurrentConfiguration(project: ProjectContext, configurationName: string, callback?: (error: ttypes.ProjectManagerError, response: void)=>void): void;

  /**
   * Get the root of a project's file and group hierarchy tree, including all children
   */
  GetRootNode(ctx: ProjectContext): Q.Promise<Node>;

  /**
   * Get the root of a project's file and group hierarchy tree, including all children
   */
  GetRootNode(ctx: ProjectContext, callback?: (error: void, response: Node)=>void): void;

  /**
   * Set a node in the project's hierarchy, possibly replacing an existing subtree if a node with the same name already exists (e.g. the project root).
   */
  SetNode(ctx: ProjectContext, node: Node): Q.Promise<void>;

  /**
   * Set a node in the project's hierarchy, possibly replacing an existing subtree if a node with the same name already exists (e.g. the project root).
   */
  SetNode(ctx: ProjectContext, node: Node, callback?: (error: void, response: void)=>void): void;

  /**
   * Within each string [:;, ] are used as separators
   */
  GetToolChainExtensions(ctx: ProjectContext): Q.Promise<string[]>;

  /**
   * Within each string [:;, ] are used as separators
   */
  GetToolChainExtensions(ctx: ProjectContext, callback?: (error: void, response: string[])=>void): void;

  /**
   * Get a list of available Toolchains.
   * 
   * Note that as of now the retrieved toolchains cannot provide a list of tools, so those need to be
   * known in advance by the client. A workaround is that the option categories ids usually match
   * the tool IDs, so they can be used as such in e.g. GetToolCommandLineForConfiguration(). See MAJ-114
   */
  GetToolchains(): Q.Promise<Toolchain[]>;

  /**
   * Get a list of available Toolchains.
   * 
   * Note that as of now the retrieved toolchains cannot provide a list of tools, so those need to be
   * known in advance by the client. A workaround is that the option categories ids usually match
   * the tool IDs, so they can be used as such in e.g. GetToolCommandLineForConfiguration(). See MAJ-114
   */
  GetToolchains(callback?: (error: ttypes.ProjectManagerError, response: Toolchain[])=>void): void;

  /**
   * Register a toolchain with the project manager. Will fail if the toolchain is already registered.
   */
  AddToolchain(toolchain: Toolchain): Q.Promise<void>;

  /**
   * Register a toolchain with the project manager. Will fail if the toolchain is already registered.
   */
  AddToolchain(toolchain: Toolchain, callback?: (error: ttypes.ProjectManagerError, response: void)=>void): void;

  /**
   * Build a project configuration synchronously, and return its result
   */
  BuildProject(prj: ProjectContext, configurationName: string): Q.Promise<BuildResult>;

  /**
   * Build a project configuration synchronously, and return its result
   */
  BuildProject(prj: ProjectContext, configurationName: string, callback?: (error: ttypes.ProjectManagerError, response: BuildResult)=>void): void;

  /**
   * Get a list of options for the given node (file, group) in a project, within the given configuration .
   */
  GetOptionsForNode(prj: ProjectContext, node: Node, configurationName: string): Q.Promise<OptionDescription[]>;

  /**
   * Get a list of options for the given node (file, group) in a project, within the given configuration .
   */
  GetOptionsForNode(prj: ProjectContext, node: Node, configurationName: string, callback?: (error: ttypes.ProjectManagerError, response: OptionDescription[])=>void): void;

  /**
   * Get a list of options for the given build configuration in a project.
   */
  GetOptionsForConfiguration(prj: ProjectContext, configurationName: string): Q.Promise<OptionDescription[]>;

  /**
   * Get a list of options for the given build configuration in a project.
   */
  GetOptionsForConfiguration(prj: ProjectContext, configurationName: string, callback?: (error: ttypes.ProjectManagerError, response: OptionDescription[])=>void): void;

  /**
   * Set a list of options for the given node (file, group) in a project. Return a list of updated options.
   */
  ApplyOptionsForNode(prj: ProjectContext, node: Node, configurationName: string, optionsToSet: OptionDescription[]): Q.Promise<OptionDescription[]>;

  /**
   * Set a list of options for the given node (file, group) in a project. Return a list of updated options.
   */
  ApplyOptionsForNode(prj: ProjectContext, node: Node, configurationName: string, optionsToSet: OptionDescription[], callback?: (error: ttypes.ProjectManagerError, response: OptionDescription[])=>void): void;

  /**
   * Set a list of options for the given node (file, group) in a project without saving to the EWP file. Return a list of updated options.
   */
  VerifyOptionsForNode(prj: ProjectContext, node: Node, configurationName: string, optionsToSet: OptionDescription[]): Q.Promise<OptionDescription[]>;

  /**
   * Set a list of options for the given node (file, group) in a project without saving to the EWP file. Return a list of updated options.
   */
  VerifyOptionsForNode(prj: ProjectContext, node: Node, configurationName: string, optionsToSet: OptionDescription[], callback?: (error: ttypes.ProjectManagerError, response: OptionDescription[])=>void): void;

  /**
   * Set a list of options for the given build configuration in a project. Return a list of updated options.
   */
  ApplyOptionsForConfiguration(prj: ProjectContext, configurationName: string, optionsToSet: OptionDescription[]): Q.Promise<OptionDescription[]>;

  /**
   * Set a list of options for the given build configuration in a project. Return a list of updated options.
   */
  ApplyOptionsForConfiguration(prj: ProjectContext, configurationName: string, optionsToSet: OptionDescription[], callback?: (error: ttypes.ProjectManagerError, response: OptionDescription[])=>void): void;

  /**
   * Set a list of options for the given build configuration in a project without saving to the EWP file. Return a list of updated options.
   */
  VerifyOptionsForConfiguration(prj: ProjectContext, configurationName: string, optionsToSet: OptionDescription[]): Q.Promise<OptionDescription[]>;

  /**
   * Set a list of options for the given build configuration in a project without saving to the EWP file. Return a list of updated options.
   */
  VerifyOptionsForConfiguration(prj: ProjectContext, configurationName: string, optionsToSet: OptionDescription[], callback?: (error: ttypes.ProjectManagerError, response: OptionDescription[])=>void): void;

  /**
   * Get a list of option categories for a given configuration
   */
  GetOptionCategories(prj: ProjectContext, configurationName: string): Q.Promise<OptionCategory[]>;

  /**
   * Get a list of option categories for a given configuration
   */
  GetOptionCategories(prj: ProjectContext, configurationName: string, callback?: (error: void, response: OptionCategory[])=>void): void;

  /**
   * Enable/disable multi-file compilation for the provided project, configuration and project node
   */
  EnableMultiFileCompilation(prj: ProjectContext, configurationName: string, node: Node, enabled: boolean): Q.Promise<void>;

  /**
   * Enable/disable multi-file compilation for the provided project, configuration and project node
   */
  EnableMultiFileCompilation(prj: ProjectContext, configurationName: string, node: Node, enabled: boolean, callback?: (error: void, response: void)=>void): void;

  /**
   * Enable/disable multi-file 'discard public symbols' for the provided project, configuration and project node
   */
  EnableMultiFileDiscardPublicSymbols(prj: ProjectContext, configurationName: string, node: Node, enabled: boolean): Q.Promise<void>;

  /**
   * Enable/disable multi-file 'discard public symbols' for the provided project, configuration and project node
   */
  EnableMultiFileDiscardPublicSymbols(prj: ProjectContext, configurationName: string, node: Node, enabled: boolean, callback?: (error: void, response: void)=>void): void;

  /**
   * Returns whether multi-file compilation is enabled for the provided project, configuration and project node
   */
  IsMultiFileCompilationEnabled(prj: ProjectContext, configurationName: string, node: Node): Q.Promise<boolean>;

  /**
   * Returns whether multi-file compilation is enabled for the provided project, configuration and project node
   */
  IsMultiFileCompilationEnabled(prj: ProjectContext, configurationName: string, node: Node, callback?: (error: void, response: boolean)=>void): void;

  /**
   * Returns whether multi-file 'discard public symbols' is enabled for the provided project, configuration and project node
   */
  IsMultiFileDiscardPublicSymbolsEnabled(prj: ProjectContext, configurationName: string, node: Node): Q.Promise<boolean>;

  /**
   * Returns whether multi-file 'discard public symbols' is enabled for the provided project, configuration and project node
   */
  IsMultiFileDiscardPublicSymbolsEnabled(prj: ProjectContext, configurationName: string, node: Node, callback?: (error: void, response: boolean)=>void): void;

  /**
   * Get the command line arguments of a tool given a build configuration in a project.
   * Note that GetToolchains() cannot currently provide information about the tools in a toolchain, so the tool
   * ids must be either known in advance, or assumed to match option category ids. See MAJ-114
   */
  GetToolArgumentsForConfiguration(prj: ProjectContext, toolId: string, configurationName: string): Q.Promise<string[]>;

  /**
   * Get the command line arguments of a tool given a build configuration in a project.
   * Note that GetToolchains() cannot currently provide information about the tools in a toolchain, so the tool
   * ids must be either known in advance, or assumed to match option category ids. See MAJ-114
   */
  GetToolArgumentsForConfiguration(prj: ProjectContext, toolId: string, configurationName: string, callback?: (error: void, response: string[])=>void): void;

  /**
   * Gets a JSON representaion of the option presentation
   * 
   * Supported locales: en_GB
   */
  GetPresentationForOptionsAsJson(locale: string): Q.Promise<string>;

  /**
   * Gets a JSON representaion of the option presentation
   * 
   * Supported locales: en_GB
   */
  GetPresentationForOptionsAsJson(locale: string, callback?: (error: ttypes.ProjectManagerError, response: string)=>void): void;
}

declare class Processor extends HeartbeatService.Processor {
  #_handler: object;

  constructor(handler: object);
  process(input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_CreateEwwFile(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_LoadEwwFile(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_SaveEwwFile(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetProjects(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetCurrentProject(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_SetCurrentProject(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_CloseWorkspace(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_CreateEwpFile(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_LoadEwpFile(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_SaveEwpFile(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_IsModified(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetProject(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_CloseProject(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_AddConfiguration(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_AddConfigurationNoSave(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_RemoveConfiguration(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_RemoveConfigurationNoSave(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetConfigurations(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_SetConfigurationsOrder(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetCurrentConfiguration(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_SetCurrentConfiguration(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetRootNode(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_SetNode(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetToolChainExtensions(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetToolchains(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_AddToolchain(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_BuildProject(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetOptionsForNode(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetOptionsForConfiguration(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_ApplyOptionsForNode(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_VerifyOptionsForNode(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_ApplyOptionsForConfiguration(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_VerifyOptionsForConfiguration(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetOptionCategories(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_EnableMultiFileCompilation(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_EnableMultiFileDiscardPublicSymbols(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_IsMultiFileCompilationEnabled(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_IsMultiFileDiscardPublicSymbolsEnabled(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetToolArgumentsForConfiguration(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_GetPresentationForOptionsAsJson(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
}
