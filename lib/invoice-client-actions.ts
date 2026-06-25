export const downloadInvoicePdf = async (
  invoiceId: string,
  invoiceNumber?: string
) => {
  const response = await fetch(`/api/invoices/${invoiceId}/pdf`);

  if (!response.ok) {
    let errorMessage = "Failed to download PDF";
    try {
      const errorData = await response.json();
      errorMessage = errorData?.error || errorMessage;
    } catch {
      // Keep default message when response is not JSON.
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const url = globalThis.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${invoiceNumber || invoiceId}.pdf`;
  document.body.appendChild(a);
  a.click();
  globalThis.URL.revokeObjectURL(url);
  a.remove();
};
