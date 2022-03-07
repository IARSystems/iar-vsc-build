/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */



import { PathLike } from "fs";
import * as Path from "path";
import { ChildProcess } from "child_process";

export namespace ListUtils {
    /**
     * Merge two or more lists. This function will return a list of unique
     * items. Duplicates are removed.
     *
     * @param list Array list containing lists of workbenches
     */
    export function mergeUnique<T>(getKey: (o: T) => string, ...lists: Array<T>[]): T[] {
        const result: Map<string, T> = new Map<string, T>();

        lists.forEach(list => {
            list.forEach(item => {
                result.set(getKey(item), item);
            });
        });

        return Array.from(result.values());
    }
}

export namespace LanguageUtils {
    const cExtensions = [".c", ".h"];
    const cppExtensions = [".cpp", ".hpp", ".cxx", ".hxx", ".cc", ".hh"];


    export type Language = "c" | "cpp";

    export function determineLanguage(filePath: PathLike): Language | undefined {
        const extension = Path.extname(filePath.toString());

        if (cExtensions.includes(extension)) {
            return "c";
        } else if (cppExtensions.includes(extension)) {
            return "cpp";
        } else {
            return undefined;
        }
    }
}

export namespace ProcessUtils {
    /**
     * Waits for a process to exit. Rejects if the exit code is non-zero.
     */
    export function waitForExit(process: ChildProcess) {
        return new Promise<void>((resolve, reject) => {
            process.on("exit", code => {
                if (code !== 0) {
                    reject(new Error("Process exited with code: " + code));
                } else {
                    resolve();
                }
            });
        });
    }
}