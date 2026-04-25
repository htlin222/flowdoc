#!/usr/bin/env node
import { main } from "../dist/cli/index.js";
const code = main(process.argv);
process.exit(typeof code === "number" ? code : 0);
