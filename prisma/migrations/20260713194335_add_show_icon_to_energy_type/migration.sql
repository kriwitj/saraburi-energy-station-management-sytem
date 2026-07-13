-- AlterTable
ALTER TABLE "energy_types" ADD COLUMN     "show_icon" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "google_map_url" TEXT;
