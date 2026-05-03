/*
  Warnings:

  - Added the required column `parking_lot_id` to the `parking_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "parking_sessions" DROP CONSTRAINT "parking_sessions_vehicle_id_fkey";

-- AlterTable
ALTER TABLE "parking_sessions" ADD COLUMN     "parking_lot_id" UUID NOT NULL,
ALTER COLUMN "vehicle_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "parking_sessions_parking_lot_id_status_vehicle_id_idx" ON "parking_sessions"("parking_lot_id", "status", "vehicle_id");

-- CreateIndex
CREATE INDEX "parking_sessions_pending_idx" ON "parking_sessions"("parking_lot_id", "status", "entry_at" ASC);

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_parking_lot_id_fkey" FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
