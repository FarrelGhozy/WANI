# Monitoring & Observability — Tahap 4

---

## 1. Health Check Endpoints

### API Health Check

```typescript
// api/src/routes/health.ts
import { Router } from 'express'
import { prisma } from '../config/db'

const router = Router()

router.get('/health', async (_req, res) => {
  const checks = {
    server: 'ok',
    database: 'pending',
    llm: 'pending',
  }

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch (err) {
    checks.database = 'error'
  }

  // Check LLM (light ping)
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)
    await fetch(`${process.env.LLM_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      signal: controller.signal,
    })
    checks.llm = 'ok'
  } catch {
    checks.llm = 'degraded'  // Not critical — bot still works without AI
  }

  const allOk = Object.values(checks).every(v => v === 'ok' || v === 'degraded')
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

export default router
```

### Docker Health Checks

```yaml
# docker-compose.yml — tambah healthcheck untuk wa-bot
wa-bot:
  healthcheck:
    test: ["CMD", "bun", "-e",
      "fetch('http://api:3001/api/health').then(r => process.exit(r.ok?0:1)).catch(() => process.exit(1))"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

---

## 2. Prometheus Metrics

### Setup

```bash
npm install prom-client  # api
```

### API Metrics

```typescript
// api/src/monitoring/metrics.ts
import client from 'prom-client'

const register = new client.Registry()
client.collectDefaultMetrics({ register })

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
})

export const llmCallCount = new client.Counter({
  name: 'llm_calls_total',
  help: 'Total LLM API calls',
  labelNames: ['model', 'status'],
})

export const llmCallDuration = new client.Histogram({
  name: 'llm_call_duration_seconds',
  help: 'LLM call duration',
  labelNames: ['model'],
  buckets: [0.5, 1, 2, 5, 10, 30],
})

export const pipelineProcessingDuration = new client.Histogram({
  name: 'pipeline_processing_duration_seconds',
  help: 'Pipeline processing duration per step',
  labelNames: ['step'],
})

export const circuitBreakerState = new client.Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
})

export const ratelimitBlocks = new client.Counter({
  name: 'ratelimit_blocks_total',
  help: 'Total rate limit blocks',
  labelNames: ['window'],
})

// Metrics endpoint
router.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})
```

---

## 3. Grafana Dashboard

### Dashboard JSON (Key Panels)

```json
{
  "dashboard": {
    "title": "WANI Platform",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [{ "expr": "rate(http_request_duration_seconds_count[5m])" }]
      },
      {
        "title": "API P95 Latency",
        "targets": [{ "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))" }]
      },
      {
        "title": "LLM Calls / min",
        "targets": [{ "expr": "rate(llm_calls_total[1m])" }]
      },
      {
        "title": "Circuit Breaker State",
        "targets": [{ "expr": "circuit_breaker_state" }]
      },
      {
        "title": "Rate Limit Blocks",
        "targets": [{ "expr": "rate(ratelimit_blocks_total[5m])" }]
      },
      {
        "title": "Pipeline Step Duration",
        "targets": [{ "expr": "rate(pipeline_processing_duration_seconds_sum[5m])" }]
      },
      {
        "title": "Error Rate",
        "targets": [{ "expr": "rate(http_request_duration_seconds_count{status='500'}[5m])" }]
      }
    ]
  }
}
```

---

## 4. Alert Rules

### Prometheus Alert Rules

```yaml
# monitoring/alerts.yml
groups:
  - name: wani_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_request_duration_seconds_count{status="500"}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate (>5%)"
          description: "Error rate is {{ $value }} for the last 5 minutes"

      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "LLM circuit breaker is OPEN"
          description: "LLM calls are being blocked"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High P95 latency (>1s)"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
```

---

## 5. Logging

### Production Logging Config

```typescript
// api/src/config/logger.ts — production mode
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()     // Structured for log aggregation
      : winston.format.prettyPrint()
  ),
  defaultMeta: { service: 'wani-api' },
  transports: [
    new winston.transports.Console(),
  ],
})
```

### Log Shipping (Optional)

Jika pakai ELK atau Loki:
```yaml
# docker-compose.yml — tambah logging driver
services:
  api:
    logging:
      driver: loki
      options:
        loki-url: http://loki:3100/loki/api/v1/push
```

---

## Checklist Monitoring

- [ ] Health check endpoint di semua service
- [ ] Docker health checks terkonfigurasi
- [ ] Prometheus metrics exported
- [ ] Grafana dashboard live
- [ ] Alert rules configured (error rate, latency, circuit breaker)
- [ ] Structured logging di production
- [ ] Log retention configured
- [ ] Uptime monitoring (UptimeRobot / Better Stack)
