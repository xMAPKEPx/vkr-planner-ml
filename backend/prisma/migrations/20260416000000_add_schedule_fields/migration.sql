-- AlterTable
ALTER TABLE "tasks"
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "estimatedDuration" DOUBLE PRECISION;
