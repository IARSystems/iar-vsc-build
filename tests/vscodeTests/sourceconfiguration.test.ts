/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as Assert from "assert";
import * as Vscode from "vscode";
import * as Path from "path";
import { IarConfigurationProvider } from "../../src/extension/cpptools/configurationprovider";
import { VscodeTestsUtils } from "./utils";
import { VscodeTestsSetup } from "./setup";
import { OsUtils } from "iar-vsc-common/osUtils";
import { ExtensionState } from "../../src/extension/extensionstate";
import { SourceFileConfiguration } from "vscode-cpptools";
import { Settings } from "../../src/extension/settings";
import { readdirSync } from "fs";

suite("Test Source Configuration (intelliSense)", ()=>{
    const USER_DEFINE_1 = "MY_DEFINE";
    const USER_DEFINE_2 = "MY_DEFINE2='test'";

    let provider: IarConfigurationProvider;
    let projectDir: string;
    let libDir: string;

    let originalUserDefines: string[];

    suiteSetup(async function() {
        this.timeout(40000);
        const sandboxPath = VscodeTestsSetup.setup();
        projectDir = Path.join(sandboxPath, "SourceConfiguration/IAR-STM32F429II-EXP/LedFlasher");
        libDir = Path.join(sandboxPath, "SourceConfiguration/STM32F4xx_DSP_StdPeriph_Lib/Libraries");

        await VscodeTestsUtils.activateProject("LedFlasher");
        originalUserDefines = Settings.getDefines();
        await Vscode.workspace.getConfiguration("iar-build").update("defines", [USER_DEFINE_1, USER_DEFINE_2]);

        const prov = IarConfigurationProvider.instance;
        Assert(prov, "Config provider should be initialized by now");
        // We need to wait for config provider to finish updating, but implementing a method
        // for waiting for it is too much work (forceUpdate can be canceled by other parts of the extension).
        // Instead just sleep for a long time.
        await new Promise((res, _) => setTimeout(res, 10000));
        await prov.forceUpdate();
        provider = prov;
    });

    suiteTeardown(() => {
        return Vscode.workspace.getConfiguration("iar-build").update("defines", originalUserDefines);
    });

    setup(function() {
        console.log("\n==========================================================" + this.currentTest!.title + "==========================================================\n");
    });

    // All files in this project have the same config, so we can reuse the assertions
    function assertConfig(config: SourceFileConfiguration) {
        const workbench = ExtensionState.getInstance().workbench.selected!;
        // Project config
        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, projectDir)));
        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, Path.join(projectDir, "board"))));
        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, Path.join(libDir, "STM32F4xx_StdPeriph_Driver/inc"))));
        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, Path.join(libDir, "CMSIS/Device/ST/STM32F4xx/Include"))));
        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, Path.join(libDir, "CMSIS/Device/ST/STM32F4xx/Source/Templates/iar"))));
        Assert(config.defines.some(define => define === "USE_STDPERIPH_DRIVER=1"));
        Assert(config.defines.some(define => define === "STM32F429X=1"));
        Assert(config.defines.some(define => define === "HSE_VALUE=8000000"));

        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, Path.join(workbench.path.toString(), "arm/CMSIS/Core/Include"))));
        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, Path.join(workbench.path.toString(), "arm/CMSIS/DSP/Include"))));

        // Compiler config
        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, Path.join(workbench.path.toString(), "arm/inc"))));
        Assert(config.includePath.some(path => OsUtils.pathsEqual(path, Path.join(workbench.path.toString(), "arm/inc/c/aarch32"))));
        Assert(config.defines.some(define => define.match(/__ARM_ARCH=\d+/)));
        Assert(config.defines.some(define => define.match(/__VERSION__=".+"/)));

        // User settings
        Assert(config.defines.some(define => define === USER_DEFINE_1));
        Assert(config.defines.some(define => define === USER_DEFINE_2));

        // IAR keywords
        Assert(config.defines.some(define => define === "__ro_placement="));
        Assert(config.defines.some(define => define === "__no_alloc="));
    }

    test("Handles project files", async() => {
        let path = Path.join(projectDir, "main.c");
        Assert(provider.isProjectFile(path));
        let config = (await provider.provideConfigurations([Vscode.Uri.file(path)]))[0];
        assertConfig(config!.configuration);

        path = Path.join(projectDir, "board/system_stm32f4xx.c");
        config = (await provider.provideConfigurations([Vscode.Uri.file(path)]))[0];
        Assert(provider.isProjectFile(path));
        assertConfig(config!.configuration);

        path = Path.join(libDir, "STM32F4xx_StdPeriph_Driver/src/misc.c");
        Assert(provider.isProjectFile(path));
        config = (await provider.provideConfigurations([Vscode.Uri.file(path)]))[0];
        assertConfig(config!.configuration);

        // check that no backup files were created (VSC-192)
        const backups = readdirSync(projectDir).filter(entry => entry.match(/Backup \(\d+\) of /));
        Assert.strictEqual(backups.length, 0, "The following backups were created: " + backups.join(", "));
    });

    test("Handles non-project files", async() => {
        let path = "thisfiledoesnotexist.c";
        Assert(!provider.isProjectFile(path));
        let config = (await provider.provideConfigurations([Vscode.Uri.file(path)]))[0];
        assertConfig(config!.configuration);

        path = Path.join(projectDir, "stm32f4xx_it.h");
        Assert(!provider.isProjectFile(path));
        config = (await provider.provideConfigurations([Vscode.Uri.file(path)]))[0];
        assertConfig(config!.configuration);
    });
});