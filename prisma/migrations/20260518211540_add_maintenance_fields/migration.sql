-- AlterTable
ALTER TABLE "FuelLog" ADD COLUMN     "km" INTEGER;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "km" INTEGER,
ADD COLUMN     "nextMaintenanceKm" INTEGER;
