/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { TestSandbox } from "iar-vsc-common/testutils/testSandbox";
import * as Path from "path" ;

export namespace VscodeTestsSetup {
    export let sandbox: TestSandbox | undefined;

    /**
     * Initiates the sandbox for this suite, copying the tests project(s) there.
     * This is called by runTests.ts when running from cli, or by the test suite itself when
     * running from vs code.
     * @returns The path to where the project(s) are copied
     */
    export function setup() {
        sandbox ??= new TestSandbox(Path.join(__dirname, "../../../"));
        return sandbox.copyToSandbox(Path.join(__dirname, "../../../tests/vscodeTests/TestProjects"), "UiTestProjects");
    }
}