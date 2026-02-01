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

export function BulkCustomerImport() {
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
      "Email",
      "Phone",
      "Billing Address",
      "Shipping Address",
      "Tax ID",
      "Notes"
    ];

    const sampleData = [
      {
        "Name": "Acme Corp",
        "Email": "contact@acme.com",
        "Phone": "+1 (555) 123-4567",
        "Billing Address": "123 Business Rd, New York, NY 10001",
        "Shipping Address": "123 Business Rd, New York, NY 10001",
        "Tax ID": "US123456789",
        "Notes": "Key Account"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    // Adjust column widths
    ws['!cols'] = [
      { wch: 25 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 35 }, // Billing Address
      { wch: 35 }, // Shipping Address
      { wch: 15 }, // Tax ID
      { wch: 20 }, // Notes
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers Template");
    XLSX.writeFile(wb, "invixy-customers-template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !currentBusiness?.id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("businessId", currentBusiness.id);

    try {
      const response = await fetch("/api/customers/bulk-import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        if (data.count > 0) {
           showSuccess("Import Completed", `Successfully imported ${data.count} customers.`);
           router.refresh();
        }
      } else {
        showError("Import Failed", "Failed to upload file. Please try again.");
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Customers</DialogTitle>
          <DialogDescription>
            Upload an Excel file to add multiple customers at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
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

          <div className="space-y-4">
             <div className="flex items-center space-x-3">
                 <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    2
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
                />
             </div>
          </div>

          {result && (
            <div className="space-y-4">
                {result.count > 0 && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Success</AlertTitle>
                        <AlertDescription className="text-green-700">
                            Successfully imported {result.count} out of {result.totalRows} customers.
                        </AlertDescription>
                    </Alert>
                )}
                
                {result.errors.length > 0 && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Import Issues</AlertTitle>
                        <AlertDescription>
                            {result.errors.length} rows failed to import.
                            <ScrollArea className="h-[100px] w-full mt-2 rounded border border-red-200 bg-white p-2">
                                <ul className="text-xs space-y-1">
                                    {result.errors.map((err, i) => (
                                        <li key={`${i}-${err}`} className="text-red-600">{err}</li>
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
                'Import Customers'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
