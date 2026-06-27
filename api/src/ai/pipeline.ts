/**
 * Thin re-export — delegates to the modular pipeline/ directory.
 * Keeps the `@/src/ai/pipeline` import path working without changes.
 */
export { processMessage } from "./pipeline/index"
