"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess } from "@/lib/alert-store";
import * as XLSX from "xlsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export function BulkProductImport() {
  const { currentBusiness } = useBusinessContext();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    count: number;
    errors: string[];
    totalRows: number;
  } | null>(null);
  const router = useRouter();

  const handleDownloadTemplate = () => {
    const headers = [
      "Name",
      "Description",
      "SKU",
      "Price",
      "Cost",
      "Category",
      "Unit",
      "Stock Quantity",
      "Alert Level",
      "Tax System"
    ];

    const sampleData = [
      {
        "Name": "Sample Product",
        "Description": "This is a sample product description",
        "SKU": "PROD-001",
        "Price": 100,
        "Cost": 50,
        "Category": "Services",
        "Unit": "pcs",
        "Stock Quantity": 100,
        "Alert Level": 10,
        "Tax System": "GST 18%"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    // Adjust column widths
    ws['!cols'] = [
      { wch: 20 }, // Name
      { wch: 30 }, // Description
      { wch: 15 }, // SKU
      { wch: 10 }, // Price
      { wch: 10 }, // Cost
      { wch: 15 }, // Category
      { wch: 10 }, // Unit
      { wch: 15 }, // Stock
      { wch: 15 }, // Alert
      { wch: 15 }, // Tax
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Template");
    XLSX.writeFile(wb, "invoice-products-template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!currentBusiness?.id) {
      showError("Missing Business", "Please select a business before importing products.");
      return;
    }
    if (!file) {
      showError("No File Selected", "Please choose an Excel file to import.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("businessId", currentBusiness.id);

    try {
      const response = await fetch("/api/products/bulk-import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data) {
        setResult(data);
        if (data.count > 0) {
           showSuccess("Import Completed", `Successfully imported ${data.count} products.`);
           router.refresh();
        } else if (data.errors?.length) {
           showError("Import Validation Failed", data.errors[0]);
        }
      } else {
        const apiErrors: string[] = data?.errors && Array.isArray(data.errors) ? data.errors : [];
        const fallbackMessage = data?.error || "Failed to upload file. Please try again.";
        setResult({
          success: false,
          count: 0,
          totalRows: 0,
          errors: apiErrors.length ? apiErrors : [fallbackMessage],
        });
        showError("Import Failed", apiErrors[0] || fallbackMessage);
      }
    } catch (error) {
      console.error("Upload error:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload an Excel file to add multiple products at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-8 w-8 text-[var(--brand-teal)]" />
              <div>
                <p className="font-medium text-sm">Step 1: Get Template</p>
                <p className="text-xs text-muted-foreground">Download the formatted Excel template</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-3 w-3" />
              Template
            </Button>
          </div>

           <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
             <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand-cobalt)]/12 text-[var(--brand-cobalt)]">
                  <Upload className="h-4 w-4" />
                 </div>
                 <div>
                    <p className="font-medium text-sm">Step 2: Upload File</p>
                    <p className="text-xs text-muted-foreground">Upload your filled template</p>
                 </div>
             </div>
             
             <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="file">Excel File</Label>
                <Input 
                    id="file" 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleFileChange} 
                  className="border-border/80"
                />
             </div>
          </div>

          {result && (
            <div className="space-y-4">
                {result.count > 0 && (
                    <Alert className="border-[var(--brand-teal)]/30 bg-[var(--brand-teal)]/10">
                      <CheckCircle className="h-4 w-4 text-[var(--brand-teal)]" />
                      <AlertTitle className="text-[var(--brand-teal)]">Success</AlertTitle>
                      <AlertDescription className="text-[var(--brand-teal)]">
                            Successfully imported {result.count} out of {result.totalRows} products.
                        </AlertDescription>
                    </Alert>
                )}
                
                {result.errors.length > 0 && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Import Issues</AlertTitle>
                        <AlertDescription>
                            {result.errors.length} rows failed to import.
                            <ScrollArea className="h-[100px] w-full mt-2 rounded border border-destructive/30 bg-background p-2">
                                <ul className="text-xs space-y-1">
                                    {result.errors.map((err, i) => (
                                  <li key={`${i}-${err}`} className="text-destructive">{err}</li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </AlertDescription>
                    </Alert>
                )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result?.success ? 'Close' : 'Cancel'}
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading || (result?.success && result.errors.length === 0)}>
            {uploading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                </>
            ) : (
                'Import Products'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
