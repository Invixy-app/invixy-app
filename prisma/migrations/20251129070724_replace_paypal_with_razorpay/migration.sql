/*
  Warnings:

  - You are about to drop the column `paypalSubscriptionId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `paypalOrderId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paypalPayerId` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Subscription" DROP COLUMN "paypalSubscriptionId",
ADD COLUMN     "razorpaySubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "paypalOrderId",
DROP COLUMN "paypalPayerId",
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'INR',
ALTER COLUMN "paymentMethod" SET DEFAULT 'RAZORPAY';
