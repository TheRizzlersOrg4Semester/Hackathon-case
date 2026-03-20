ALTER TABLE "Donation"
ADD COLUMN "paymentBillingPostalCode" TEXT,
ADD COLUMN "paymentCardBrand" TEXT,
ADD COLUMN "paymentCardLast4" TEXT,
ADD COLUMN "paymentCardholderName" TEXT,
ADD COLUMN "paymentExpiryMonth" INTEGER,
ADD COLUMN "paymentExpiryYear" INTEGER;
