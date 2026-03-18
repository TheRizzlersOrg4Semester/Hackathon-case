-- CreateEnum
CREATE TYPE "CampaignRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CampaignRequest" (
    "id" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goalAmount" DECIMAL(12,2) NOT NULL,
    "motivation" TEXT NOT NULL,
    "status" "CampaignRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "approvedCampaignId" TEXT,
    CONSTRAINT "CampaignRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRequest_approvedCampaignId_key" ON "CampaignRequest"("approvedCampaignId");

-- CreateIndex
CREATE INDEX "CampaignRequest_status_createdAt_idx" ON "CampaignRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignRequest_reviewedById_reviewedAt_idx" ON "CampaignRequest"("reviewedById", "reviewedAt");

-- AddForeignKey
ALTER TABLE "CampaignRequest" ADD CONSTRAINT "CampaignRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRequest" ADD CONSTRAINT "CampaignRequest_approvedCampaignId_fkey" FOREIGN KEY ("approvedCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
