// Prints the getting-started guide in the terminal:  npm run guide
import { readFileSync } from "node:fs";
process.stdout.write(readFileSync(new URL("../START-HERE.txt", import.meta.url), "utf8"));
