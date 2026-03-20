ALTER TABLE "Campaign"
ADD COLUMN "celebrationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "completedAt" TIMESTAMP(3);
