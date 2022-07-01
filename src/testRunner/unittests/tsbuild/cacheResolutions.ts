import { noChangeRun, noChangeWithExportsDiscrepancyRun, prependText, verifyTscWithEdits } from "../tsc/helpers";
import { getFsWithNode16, getFsWithOut, getPkgImportContent, getPkgTypeRefContent } from "./cacheResolutionsHelper";

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
});