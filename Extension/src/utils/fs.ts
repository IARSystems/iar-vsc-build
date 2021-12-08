/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as path from "path";
import * as fs from "fs";

export namespace FsUtils {
    // Node has no promise-based exists function
    export async function exists(p: fs.PathLike): Promise<boolean> {
        try {
            await fs.promises.access(p, fs.constants.R_OK);
            return true;
        } catch {
        }
        return false;
    }

    export function filteredListDirectory(dirPath: fs.PathLike, filterCallback: (path: fs.PathLike) => boolean): fs.PathLike[] {
        return walkAndFind(dirPath, false, filterCallback);
    }

    export function walkAndFind(dirPath: fs.PathLike, recursive: boolean, filterCallback: (path: fs.PathLike) => boolean): fs.PathLike[] {
        let children: fs.PathLike[] = [];

        if (fs.existsSync(dirPath)) {
            const stat = fs.statSync(dirPath);

            if (stat.isDirectory()) {
                const dir = fs.readdirSync(dirPath);

                dir.forEach(child => {
                    const fullpath = path.join(dirPath.toString(), child);

                    if (filterCallback(fullpath)) {
                        children.push(fullpath);
                    }

                    if (recursive) {
                        const stat = fs.statSync(fullpath);

                        if (stat.isDirectory()) {
                            children = children.concat(walkAndFind(fullpath, true, filterCallback));
                        }
                    }
                });
            }
        }

        return children;
    }

    export function createFilteredListDirectoryFilenameRegex(regex: RegExp): (fullpath: fs.PathLike) => boolean {
        return (fullpath: fs.PathLike): boolean => {
            const stat = fs.statSync(fullpath);

            if (stat.isFile()) {
                const parsedPath = path.parse(fullpath.toString());
                const filename = parsedPath.base;

                return regex.test(filename);
            } else {
                return false;
            }
        };
    }
}