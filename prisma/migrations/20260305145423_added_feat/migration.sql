-- CreateEnum
CREATE TYPE "public"."InvoiceTemplate" AS ENUM ('TEMPLATE_1', 'TEMPLATE_2');

-- AlterTable
ALTER TABLE "public"."Business" ADD COLUMN     "invoiceTemplate" "public"."InvoiceTemplate" NOT NULL DEFAULT 'TEMPLATE_1';

-- AlterTable
ALTER TABLE "public"."Transaction" ALTER COLUMN "currency" SET DEFAULT 'USD';
