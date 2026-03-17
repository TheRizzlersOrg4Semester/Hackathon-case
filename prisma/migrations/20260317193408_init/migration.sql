-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('ONE_TIME', 'RECURRING');

-- CreateEnum
CREATE TYPE "ThankYouTier" AS ENUM ('BASIC', 'PERSONAL', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'TRIGGERED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "goalAmount" DECIMAL(12,2) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "categoryId" TEXT,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "donationType" "DonationType" NOT NULL DEFAULT 'ONE_TIME',
    "donorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationReceipt" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "DonationReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThankYouAction" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "tier" "ThankYouTier" NOT NULL,
    "emailStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThankYouAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_categoryId_idx" ON "Campaign"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Donation_campaignId_createdAt_idx" ON "Donation"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "Donation_userId_createdAt_idx" ON "Donation"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DonationReceipt_donationId_key" ON "DonationReceipt"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationReceipt_receiptNumber_key" ON "DonationReceipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ThankYouAction_donationId_key" ON "ThankYouAction"("donationId");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_createdAt_idx" ON "AuditEvent"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationReceipt" ADD CONSTRAINT "DonationReceipt_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThankYouAction" ADD CONSTRAINT "ThankYouAction_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
