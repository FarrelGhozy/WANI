import { logger } from "@/src/config/logger";
import { State, type CircuitResult, type CircuitState } from "@/src/types/ai";

export { State, type CircuitResult, type CircuitState };

interface BreakerStatus {
  failures: number;
  lastFailure: number;
  halfOpen: boolean;
}

