/**
 * InvoiceForge PDF Generation & Print Engine
 * Leverages html2pdf.js for exact A4 rasterization and window.print() for physical printing.
 */

const PDFEngine = {
  /**
   * Generates and downloads a real professional A4 PDF file
   * @param {Object} invoice 
   * @param {Object} totals 
   */
  async downloadPDF(invoice, totals) {
    const previewElement = document.getElementById('invoice-preview-canvas');
    if (!previewElement) {
      Validation.showToast('Preview canvas not found', 'error');
      return;
    }

    // Friendly loading indicator
    Validation.showToast('Generating high-resolution A4 PDF...', 'info', 2000);

    // Sanitize filename
    const safeInvNum = (invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeCustName = (invoice.customer?.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);
    const filename = `Invoice_${safeInvNum}_${safeCustName}.pdf`;

    // Clone element to avoid modifying the active DOM preview view scale
    const clone = previewElement.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.padding = '12mm 14mm';
    clone.style.background = '#ffffff';

    // Temporary off-screen container
    const offscreenContainer = document.createElement('div');
    offscreenContainer.style.position = 'fixed';
    offscreenContainer.style.top = '-9999px';
    offscreenContainer.style.left = '-9999px';
    offscreenContainer.style.width = '210mm';
    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    // html2pdf options for exact A4 fidelity
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2, // High resolution retina scale
        useCORS: true,
        logging: false,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    try {
      if (window.html2pdf) {
        await window.html2pdf().set(opt).from(clone).save();
        Validation.showToast(`PDF downloaded: ${filename}`, 'success');
      } else {
        // Fallback if CDN failed
        window.print();
      }
    } catch (err) {
      console.error('[InvoiceForge] PDF Generation Error:', err);
      Validation.showToast('Failed to generate PDF. Triggering print dialog...', 'warning');
      window.print();
    } finally {
      // Clean up offscreen container
      if (document.body.contains(offscreenContainer)) {
        document.body.removeChild(offscreenContainer);
      }
    }
  },

  /**
   * Triggers native browser print dialog formatted for A4
   */
  printInvoice() {
    window.print();
  }
};

window.PDFEngine = PDFEngine;
