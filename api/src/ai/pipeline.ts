/**
 * Thin re-export — delegates to the modular pipeline/ directory.
 * Keeps the `@/ai/pipeline` import path working without changes.
 */
export { processMessage } from "./pipeline/index";
