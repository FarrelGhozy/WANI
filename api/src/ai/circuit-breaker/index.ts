interface BreakerStatus {
  failures: number;
  lastFailure: number;
  halfOpen: boolean;
}
