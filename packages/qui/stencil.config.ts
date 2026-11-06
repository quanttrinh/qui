/// <reference types="node" />
import type { Config } from "@stencil/core";

import { createNodeLogger } from "@stencil/core/sys/node";

import { watchIgnoredPatterns } from "../../tooling/ignore";
import { createBuildConfig } from "./build/config";
import { frameworkTypesOutputTarget } from "./build/output-targets/framework-types-output-target";
import { utilitiesOutputTarget } from "./build/output-targets/utilities-output-target";
import { createPandaDriver } from "./build/panda/panda-driver";
import { pandacssTransform } from "./build/plugins/rollup/pandacss";
import { stylesPlugin } from "./build/plugins/stencil/styles";

const build = createBuildConfig(__dirname);
const logger = createNodeLogger();
const pandaDriver = createPandaDriver(build);
const isTest = process.env.NODE_ENV === "test";
const testProject = process.env.STENCIL_TEST_PROJECT;
const needsHydrate =
  !isTest ||
  testProject === undefined ||
  testProject === "all" ||
  testProject === "unit" ||
  testProject === "integration";

const outputTargets: NonNullable<Config["outputTargets"]> = [
  isTest
    ? {
        type: "www" as const,
        dir: build.output.test,
        serviceWorker: null,
      }
    : {
        type: "www" as const,
        serviceWorker: null,
        copy: [
          { src: build.file.sharedCss, dest: "styles.css" },
          { src: build.file.themeCss, dest: "theme.css" },
        ],
      },
];

if (!isTest) {
  outputTargets.push({
    type: "dist-custom-elements",
    dir: build.output.shared,
    generateTypeDeclarations: true,
    customElementsExportBehavior: "single-export-module",
    externalRuntime: false,
  });
}

if (needsHydrate) {
  outputTargets.push({
    type: "dist-hydrate-script",
    dir: build.output.hydrate,
  });
}

if (!isTest) {
  outputTargets.push(utilitiesOutputTarget(build), frameworkTypesOutputTarget({ config: build }));
}

export const config: Config = {
  namespace: "qui",
  logger,
  plugins: [stylesPlugin({ config: build, driver: pandaDriver, logger })],
  rollupPlugins: {
    before: pandacssTransform({ config: build, driver: pandaDriver, logger }),
  },
  tsconfig: build.file.tsconfig,
  watchIgnoredRegex: watchIgnoredPatterns,
  outputTargets,
};
