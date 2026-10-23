import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { findComponents, writeStyleUrlModule } from "./styles.stencil.plugin";

const root = dirname(fileURLToPath(import.meta.url));
const components = findComponents(root);

writeStyleUrlModule(join(root, "styled-system"), components);
console.log(`style-urls: wrote ${components.length} entries`);
