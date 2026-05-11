-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "deactivated_at" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "parking_lots" ADD COLUMN     "deactivated_at" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "parking_spots" ADD COLUMN     "deactivated_at" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "deactivated_at" TIMESTAMPTZ(3);
