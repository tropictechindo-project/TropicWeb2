-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('VAN', 'MOTORCYCLE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('INTERNAL', 'GOJEK');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('DROPOFF', 'PICKUP');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'CLAIMED', 'OUT_FOR_DELIVERY', 'PAUSED', 'DELAYED', 'CANCEL_REQUESTED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DeliveryRole" AS ENUM ('ADMIN', 'WORKER', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "daily_reports" DROP CONSTRAINT "daily_reports_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "daily_reports" DROP CONSTRAINT "daily_reports_worker_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_checklist_items" DROP CONSTRAINT "delivery_checklist_items_report_id_fkey";

-- DropForeignKey
ALTER TABLE "worker_schedules" DROP CONSTRAINT "worker_schedules_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "worker_schedules" DROP CONSTRAINT "worker_schedules_order_id_fkey";

-- DropForeignKey
ALTER TABLE "worker_schedules" DROP CONSTRAINT "worker_schedules_worker_id_fkey";

-- DropIndex
DROP INDEX "idx_orders_delivery_status";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "delivery_status";

-- DropTable
DROP TABLE "daily_reports";

-- DropTable
DROP TABLE "delivery_checklist_items";

-- DropTable
DROP TABLE "worker_schedules";

-- DropEnum
DROP TYPE "schedule_status";

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "current_delivery_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID,
    "delivery_method" "DeliveryMethod" NOT NULL,
    "delivery_type" "DeliveryType" NOT NULL,
    "vehicle_id" UUID,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "claimed_by_worker_id" UUID,
    "claimed_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "eta" TIMESTAMPTZ(6),
    "eta_override_count" INTEGER NOT NULL DEFAULT 0,
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "last_location_update" TIMESTAMPTZ(6),
    "tracking_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delivery_id" UUID NOT NULL,
    "rental_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "delivery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delivery_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_by_user_id" UUID,
    "role" "DeliveryRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_edit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delivery_id" UUID NOT NULL,
    "edited_by_user_id" UUID NOT NULL,
    "role" "DeliveryRole" NOT NULL,
    "field_changed" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_edit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_tracking_code_key" ON "deliveries"("tracking_code");

-- CreateIndex
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");

-- CreateIndex
CREATE INDEX "deliveries_tracking_code_idx" ON "deliveries"("tracking_code");

-- CreateIndex
CREATE INDEX "deliveries_invoice_id_idx" ON "deliveries"("invoice_id");

-- CreateIndex
CREATE INDEX "delivery_items_delivery_id_idx" ON "delivery_items"("delivery_id");

-- CreateIndex
CREATE INDEX "delivery_items_rental_item_id_idx" ON "delivery_items"("rental_item_id");

-- CreateIndex
CREATE INDEX "delivery_logs_delivery_id_idx" ON "delivery_logs"("delivery_id");

-- CreateIndex
CREATE INDEX "delivery_edit_logs_delivery_id_idx" ON "delivery_edit_logs"("delivery_id");

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_claimed_by_worker_id_fkey" FOREIGN KEY ("claimed_by_worker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_rental_item_id_fkey" FOREIGN KEY ("rental_item_id") REFERENCES "rental_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_edit_logs" ADD CONSTRAINT "delivery_edit_logs_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_edit_logs" ADD CONSTRAINT "delivery_edit_logs_edited_by_user_id_fkey" FOREIGN KEY ("edited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

