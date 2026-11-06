import { createPandaPlugin } from "@pandacss/eslint-plugin";
import { dirname } from "node:path";

/**
 * Build the Oxlint plugin for a Panda config.
 *
 * @param {string} configPath Absolute path to `panda.config.ts`.
 */
async function createPandaOxlintPlugin(configPath) {
    const packageRoot = dirname(configPath);
    const previousCwd = process.cwd();
    process.chdir(packageRoot);

    try {
        const { rules } = await createPandaPlugin({ cwd: packageRoot, configPath });
        return { meta: { name: "@pandacss" }, rules };
    } finally {
        process.chdir(previousCwd);
    }
}

const configPath = process.env.PANDA_CONFIG_PATH;
if (!configPath) {
    throw new Error("PANDA_CONFIG_PATH must point to the Panda config");
}

export default await createPandaOxlintPlugin(configPath);
