/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

import * as Os from "os";
import * as Fs from "fs";
import * as Path from "path";
import * as Process from "child_process";
import { FsUtils } from "../../utils/fs";
import { ListUtils, OsUtils } from "../../utils/utils";
import { Define } from "../project/define";
import { IncludePath } from "../project/includepath";
import { Keyword } from "../project/keyword";

export interface Compiler {
    readonly name: string;
    readonly path: Fs.PathLike;
    readonly defines: Define[];
    readonly includePaths: IncludePath[];
    readonly supportedKeywords: Keyword[];

    prepare(): void;
}

type CompilerOutput = { defines: Define[], includePaths: IncludePath[] };

class IarCompiler implements Compiler {
    readonly path: Fs.PathLike;
    private _defines: Define[] | undefined;
    private _includePaths: IncludePath[] | undefined;
    private _supportedKeywords: Keyword[] | undefined;

    /**
     * Create a new Compiler object.
     * 
     * @param path Path to a compiler
     */
    constructor(path: Fs.PathLike) {
        this.path = path;

        if (!this.isValidCompiler()) {
            throw new Error("path does not point to a valid compiler.");
        }

        this._defines = undefined;
        this._includePaths = undefined;
        this._supportedKeywords = undefined;
    }

    public prepare(): void {
        if ((this._defines === undefined) || (this._includePaths === undefined)) {
            let { defines, includePaths } = this.computeCompilerSpecifics();

            this._defines = defines;
            this._includePaths = includePaths;
        }
        if (this._supportedKeywords === undefined) {
            this._supportedKeywords = this.computeSupportedKeywords();
        }
    }

    get name(): string {
        return Path.parse(this.path.toString()).name;
    }

    get defines(): Define[] {
        if (this._defines === undefined) {
            return [];
        } else {
            return this._defines;
        }
    }

    get includePaths(): IncludePath[] {
        if (this._includePaths === undefined) {
            return [];
        } else {
            return this._includePaths;
        }
    }

    get supportedKeywords(): Keyword[] {
        if (this._supportedKeywords === undefined) {
            return [];
        } else {
            return this._supportedKeywords;
        }
    }

    /**
     * Check if the path points to a valid compiler.
     */
    protected isValidCompiler(): boolean {
        /* TODO: More advanced check by executing the compiler with some specific flags? */
        try {
            let stat = Fs.statSync(this.path);
            return stat.isFile();
        } catch (e) {
            return false;
        }
    }

    protected computeCompilerSpecifics(): CompilerOutput {
        let cmd = this.path.toString();
        let tmpFile = Path.join(Os.tmpdir(), "iarvsc.c");
        let tmpOutFile = Path.join(Os.tmpdir(), "iarvsc.predef_macros");
        let args = ["--IDE3", tmpFile, "--predef_macros", tmpOutFile];

        try {
            let stat = Fs.statSync(tmpFile);

            if (stat.isDirectory()) {
                Fs.rmdirSync(tmpFile);
            } else if (stat.isFile()) {
                Fs.unlinkSync(tmpFile);
            }
        } catch (e) {
        }

        try {
            let stat = Fs.statSync(tmpOutFile);

            if (stat.isDirectory()) {
                Fs.rmdirSync(tmpOutFile);
            } else if (stat.isFile()) {
                Fs.unlinkSync(tmpOutFile);
            }
        } catch (e) {
        }

        Fs.writeFileSync(tmpFile, "");

        let process = Process.spawnSync(cmd, args, { encoding: "utf8" });

        let defines = this.parseDefinesFrom(tmpOutFile);
        let includePaths = this.parseIncludePathsFrom(process.stdout);

        return { defines: defines, includePaths: includePaths };
    }

    private parseDefinesFrom(filePath: Fs.PathLike): Define[] {
        if (Fs.existsSync(filePath)) {
            return Define.fromSourceFile(filePath);
        } else {
            return [];
        }
    }

    private parseIncludePathsFrom(compilerOutput: string): IncludePath[] {
        return IncludePath.fromCompilerOutput(compilerOutput);
    }

    private computeSupportedKeywords(): Keyword[] {
        // C syntax files are named <platform dir>/config/syntax_icc.cfg
        const platformBasePath = Path.dirname(this.path.toString()) + "/.."
        const filePath         = platformBasePath + "/config/syntax_icc.cfg"
        if (Fs.existsSync(filePath)) {
            return Keyword.fromSyntaxFile(filePath);
        } else {
            return [];
        }
    }

}

export namespace Compiler {
    /**
     * Collect all available compilers for a platform.
     * 
     * @param platform The platform for which we must find compilers.
     */
    export function collectCompilersFrom(root: Fs.PathLike): Compiler[] {
        let compilers: Compiler[] = [];
        let regex = "icc.*";
        if (OsUtils.detectOsType() === OsUtils.OsType.Windows) {
            regex += "\.exe";
        }
        let filter = FsUtils.createFilteredListDirectoryFilenameRegex(new RegExp(regex));
        let compilerPaths = FsUtils.filteredListDirectory(root, filter);

        compilerPaths.forEach(compilerPath => {
            let compiler = create(compilerPath);

            if (compiler !== undefined) {
                compilers.push(compiler);
            }
        });

        return compilers;
    }

    export function mergeUnique(...lists: Compiler[][]): Compiler[] {
        let fnKey = (item: Compiler): string => {
            return item.path.toString();
        };

        return ListUtils.mergeUnique(fnKey, ...lists);
    }

    /**
     * Create a new Compiler object.
     * 
     * @param path The path to the compiler
     * @returns {undefined} When the path does not point to a valid compiler
     * @returns {Compiler} When the path points to a valid compiler
     */
    function create(path: Fs.PathLike): Compiler | undefined {
        try {
            return new IarCompiler(path);
        } catch (e) {
            return undefined;
        }
    }
}