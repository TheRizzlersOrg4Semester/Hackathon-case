-- AlterTable
ALTER TABLE "Donation"
ADD COLUMN     "subscribedToUpdates" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CampaignMilestone" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignMilestone_campaignId_displayOrder_idx" ON "CampaignMilestone"("campaignId", "displayOrder");

-- AddForeignKey
ALTER TABLE "CampaignMilestone" ADD CONSTRAINT "CampaignMilestone_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
