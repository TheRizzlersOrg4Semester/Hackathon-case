-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "brandImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "blobColor" TEXT,
ADD COLUMN "donationAccessId" TEXT;

-- CreateTable
CREATE TABLE "DonationAccess" (
    "id" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DonationAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationAccess_accessCode_key" ON "DonationAccess"("accessCode");

-- CreateIndex
CREATE INDEX "Donation_donationAccessId_createdAt_idx" ON "Donation"("donationAccessId", "createdAt");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donationAccessId_fkey" FOREIGN KEY ("donationAccessId") REFERENCES "DonationAccess"("id") ON DELETE SET NULL ON UPDATE CASCADE;
