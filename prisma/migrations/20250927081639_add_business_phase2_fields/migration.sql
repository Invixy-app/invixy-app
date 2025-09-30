-- AlterTable
ALTER TABLE "public"."Business" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';
