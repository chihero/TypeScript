import * as ts from "../../_namespaces/ts";
import { noChangeRun, noChangeWithExportsDiscrepancyRun, prependText, verifyTscWithEdits } from "../tsc/helpers";
import { getFsWithMultipleProjects, getFsWithNode16, getFsWithOut, getFsWithSameResolutionFromMultiplePlaces, getPkgImportContent, getPkgTypeRefContent } from "./cacheResolutionsHelper";

describe("unittests:: tsbuild:: cacheResolutions::", () => {
    verifyTscWithEdits({
        scenario: "cacheResolutions",
        subScenario: "multi file",
        fs: getFsWithNode16,
        commandLineArgs: ["-b", "/src/project", "--explainFiles"],
        edits: [
            noChangeWithExportsDiscrepancyRun,
            {
                subScenario: "write file not resolved by import",
                modifyFs: fs => fs.writeFileSync("/src/project/node_modules/pkg1/require.d.ts", getPkgImportContent("Require", 1)),
                discrepancyExplanation: noChangeWithExportsDiscrepancyRun.discrepancyExplanation
            },
            {
                subScenario: "write file not resolved by typeRef",
                modifyFs: fs => fs.writeFileSync("/src/project/node_modules/pkg3/require.d.ts", getPkgTypeRefContent("Require", 3)),
            },
            {
                subScenario: "modify randomFileForImport by adding import",
                modifyFs: fs => prependText(fs, "/src/project/randomFileForImport.ts", `import type { ImportInterface0 } from "pkg0" assert { "resolution-mode": "import" };\n`),
            },
            {
                subScenario: "modify randomFileForTypeRef by adding typeRef",
                modifyFs: fs => prependText(fs, "/src/project/randomFileForTypeRef.ts", `/// <reference types="pkg2" resolution-mode="import"/>\n`),
            },
        ]
    });

    verifyTscWithEdits({
        scenario: "cacheResolutions",
        subScenario: "bundle emit",
        fs: getFsWithOut,
        commandLineArgs: ["-b", "/src/project", "--explainFiles"],
        edits: [
            noChangeRun,
            {
                subScenario: "write file not resolved by import",
                modifyFs: fs => fs.writeFileSync("/src/project/pkg1.d.ts", getPkgImportContent("Require", 1)),
            },
            {
                subScenario: "write file not resolved by typeRef",
                modifyFs: fs => {
                    fs.mkdirpSync("/src/project/node_modules/pkg3");
                    fs.writeFileSync("/src/project/node_modules/pkg3/index.d.ts", getPkgTypeRefContent("Require", 3));
                },
            },
            {
                subScenario: "modify randomFileForImport by adding import",
                modifyFs: fs => prependText(fs, "/src/project/randomFileForImport.ts", `import type { ImportInterface0 } from "pkg0";\n`),
            },
            {
                subScenario: "modify randomFileForTypeRef by adding typeRef",
                modifyFs: fs => prependText(fs, "/src/project/randomFileForTypeRef.ts", `/// <reference types="pkg2"/>\n`),
            },
        ]
    });

    verifyTscWithEdits({
        scenario: "cacheResolutions",
        subScenario: "multi project",
        fs: getFsWithMultipleProjects,
        commandLineArgs: ["-b", "/src/project", "--explainFiles", "--v"],
        edits: [
            {
                subScenario: "modify aRandomFileForImport by adding import",
                modifyFs: fs => prependText(fs, "/src/project/aRandomFileForImport.ts", `export type { ImportInterface0 } from "pkg0";\n`),
            },
            {
                subScenario: "modify bRandomFileForImport by adding import",
                modifyFs: fs => prependText(fs, "/src/project/bRandomFileForImport.ts", `export type { ImportInterface0 } from "pkg0";\n`),
            },
            {
                subScenario: "modify cRandomFileForImport by adding import",
                modifyFs: fs => prependText(fs, "/src/project/cRandomFileForImport.ts", `export type { ImportInterface0 } from "pkg0";\n`),
            },
            {
                subScenario: "Project build on B",
                modifyFs: ts.noop,
                commandLineArgs: ["-p", "/src/project/tsconfig.b.json", "--explainFiles"],
                discrepancyExplanation: () => [
                    "During incremental build, build succeeds because everything was built",
                    "Clean build does not have project build from a so it errors and has extra errors and incorrect buildinfo",
                ]
            },
            {
                subScenario: "modify bRandomFileForImport2 by adding import and project build",
                modifyFs: fs => prependText(fs, "/src/project/bRandomFileForImport2.ts", `export type { ImportInterface0 } from "pkg0";\n`),
                commandLineArgs: ["-p", "/src/project/tsconfig.b.json", "--explainFiles"],
                discrepancyExplanation: () => [
                    "During incremental build, build succeeds because everything was built",
                    "Clean build does not have project build from a so it errors and has extra errors and incorrect buildinfo",
                ]
            },
            {
                subScenario: "Project build on c",
                modifyFs: ts.noop,
                commandLineArgs: ["-p", "/src/project", "--explainFiles"],
                discrepancyExplanation: () => [
                    "During incremental build, build succeeds because everything was built",
                    "Clean build does not have project build from a and b so it errors and has extra errors and incorrect buildinfo",
                ]
            },
            {
                subScenario: "modify cRandomFileForImport2 by adding import and project build",
                modifyFs: fs => prependText(fs, "/src/project/cRandomFileForImport2.ts", `export type { ImportInterface0 } from "pkg0";\n`),
                commandLineArgs: ["-p", "/src/project", "--explainFiles"],
                discrepancyExplanation: () => [
                    "During incremental build, build succeeds because everything was built",
                    "Clean build does not have project build from a and b so it errors and has extra errors and incorrect buildinfo",
                ]
            },
        ]
    });

    verifyTscWithEdits({
        scenario: "cacheResolutions",
        subScenario: "multiple places",
        fs: getFsWithSameResolutionFromMultiplePlaces,
        commandLineArgs: ["-b", "/src/project", "--explainFiles"],
        edits: [
            {
                subScenario: "modify randomFileForImport by adding import",
                modifyFs: fs => prependText(fs, "/src/project/randomFileForImport.ts", `import type { ImportInterface0 } from "pkg0";\n`),
            },
            {
                subScenario: "modify b/randomFileForImport by adding import",
                modifyFs: fs => prependText(fs, "/src/project/b/randomFileForImport.ts", `import type { ImportInterface0 } from "pkg0";\n`),
                discrepancyExplanation: () => [
                    "Resolution is not reused in incremental which is TODO (shkamat)"
                ]
            },
            {
                subScenario: "modify c/ca/caa/randomFileForImport by adding import",
                modifyFs: fs => prependText(fs, "/src/project/c/ca/caa/randomFileForImport.ts", `import type { ImportInterface0 } from "pkg0";\n`),
                discrepancyExplanation: () => [
                    "Resolution is not reused in incremental which is TODO (shkamat)"
                ]
            },
        ]
    });
});