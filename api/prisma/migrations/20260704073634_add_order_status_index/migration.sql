-- CreateIndex
-- ponytail: idempotent so manual pre-apply or re-deploy both safe
CREATE INDEX IF NOT EXISTS "idx_orders_status_created_at" ON "Order"("status", "createdAt");