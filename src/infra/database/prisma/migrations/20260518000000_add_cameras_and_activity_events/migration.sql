-- AlterEnum
ALTER TYPE "SpotStatus" ADD VALUE 'MAINTENANCE';

-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ONLINE', 'OFFLINE', 'UNREGISTERED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM (
  'VEHICLE_ENTERED',
  'SPOT_OCCUPIED',
  'SPOT_RELEASED',
  'VEHICLE_EXITED',
  'SESSION_STARTED',
  'SESSION_FINISHED',
  'MANUAL_FORCE_FINISH',
  'MANUAL_FORCE_PLATE',
  'SPOT_MAINTENANCE_ON',
  'SPOT_MAINTENANCE_OFF',
  'CAMERA_ONLINE',
  'CAMERA_OFFLINE'
);

-- CreateTable
CREATE TABLE "cameras" (
    "id" UUID NOT NULL,
    "parking_lot_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "stream_url" TEXT NOT NULL,
    "status" "CameraStatus" NOT NULL DEFAULT 'UNREGISTERED',
    "last_seen_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deactivated_at" TIMESTAMPTZ(3),

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cameras_parking_lot_id_idx" ON "cameras"("parking_lot_id");

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_parking_lot_id_fkey" FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "activity_events" (
    "id" UUID NOT NULL,
    "parking_lot_id" UUID NOT NULL,
    "session_id" UUID,
    "vehicle_id" UUID,
    "spot_id" UUID,
    "camera_id" UUID,
    "type" "ActivityType" NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_events_parking_lot_id_occurred_at_idx" ON "activity_events"("parking_lot_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "activity_events_session_id_idx" ON "activity_events"("session_id");

-- CreateIndex
CREATE INDEX "activity_events_vehicle_id_idx" ON "activity_events"("vehicle_id");

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_parking_lot_id_fkey" FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
