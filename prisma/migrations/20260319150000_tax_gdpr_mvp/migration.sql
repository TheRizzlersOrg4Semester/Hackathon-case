-- CreateEnum
CREATE TYPE "TaxIdType" AS ENUM ('CPR', 'CVR');

-- AlterTable
ALTER TABLE "Donation"
ADD COLUMN     "taxEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "taxIdType" "TaxIdType";

-- CreateIndex
CREATE INDEX "Donation_taxId_createdAt_idx" ON "Donation"("taxId", "createdAt");
