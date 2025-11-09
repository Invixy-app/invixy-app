-- AlterTable
ALTER TABLE "public"."InvoiceItem" ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."InvoiceItemTax" (
    "id" TEXT NOT NULL,
    "invoiceItemId" TEXT NOT NULL,
    "taxSystemId" TEXT NOT NULL,
    "taxableAmount" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "InvoiceItemTax_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."InvoiceItemTax" ADD CONSTRAINT "InvoiceItemTax_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "public"."InvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItemTax" ADD CONSTRAINT "InvoiceItemTax_taxSystemId_fkey" FOREIGN KEY ("taxSystemId") REFERENCES "public"."TaxSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
