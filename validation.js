/**
 * InvoiceForge Validation & Toast Notification System
 * Validates invoice payload before saving/downloading and displays polished toast alerts.
 */

const Validation = {
  /**
   * Validate entire invoice structure
   * @param {Object} invoice 
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validateInvoice(invoice) {
    const errors = [];

    // 1. Business Info Validation
    if (!invoice.business || !invoice.business.name || !invoice.business.name.trim()) {
      errors.push('Business Name is required');
    }

    // 2. Customer Info Validation
    if (!invoice.customer || !invoice.customer.name || !invoice.customer.name.trim()) {
      errors.push('Customer Name is required');
    }

    // 3. Invoice Number Validation
    if (!invoice.invoiceNumber || !invoice.invoiceNumber.trim()) {
      errors.push('Invoice Number is required');
    }

    // 4. Invoice Dates
    if (!invoice.invoiceDate) {
      errors.push('Invoice Date is required');
    }

    // 5. Items Validation
    if (!invoice.items || invoice.items.length === 0) {
      errors.push('At least one line item is required');
    } else {
      let hasValidItem = false;
      invoice.items.forEach((item, index) => {
        const itemNum = index + 1;
        const name = (item.name || '').trim();
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);

        if (!name && invoice.items.length === 1) {
          errors.push(`Item #${itemNum}: Item Name / Service description is required`);
        }

        if (isNaN(qty) || qty <= 0) {
          errors.push(`Item #${itemNum} ("${name || 'Unnamed'}"): Quantity must be greater than 0`);
        }

        if (isNaN(price) || price < 0) {
          errors.push(`Item #${itemNum} ("${name || 'Unnamed'}"): Unit Price cannot be negative`);
        }

        if (name && qty > 0 && price >= 0) {
          hasValidItem = true;
        }
      });

      if (!hasValidItem && errors.length === 0) {
        errors.push('Please provide valid details for at least one item');
      }
    }

    // 6. Tax Validation
    if (invoice.taxRate !== undefined && invoice.taxRate !== null) {
      const taxRate = parseFloat(invoice.taxRate);
      if (isNaN(taxRate) || taxRate < 0) {
        errors.push('Tax percentage cannot be negative');
      }
    }

    // 7. Discount Validation
    if (invoice.discountValue !== undefined && invoice.discountValue !== null) {
      const discount = parseFloat(invoice.discountValue);
      if (isNaN(discount) || discount < 0) {
        errors.push('Discount value cannot be negative');
      }
      if (invoice.discountType === 'percent' && discount > 100) {
        errors.push('Discount percentage cannot exceed 100%');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Toast notification display engine
   */
  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 transform toast-slide-in pointer-events-auto`;

    // Colors & Icons by type
    let bgBorderText = '';
    let iconSvg = '';

    if (type === 'success') {
      bgBorderText = 'bg-emerald-50 border-emerald-200 text-emerald-900';
      iconSvg = `
        <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      `;
    } else if (type === 'error') {
      bgBorderText = 'bg-rose-50 border-rose-200 text-rose-900';
      iconSvg = `
        <svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      `;
    } else if (type === 'warning') {
      bgBorderText = 'bg-amber-50 border-amber-200 text-amber-900';
      iconSvg = `
        <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      `;
    } else {
      bgBorderText = 'bg-slate-900 border-slate-800 text-white';
      iconSvg = `
        <svg class="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      `;
    }

    toast.className += ` ${bgBorderText}`;
    toast.innerHTML = `
      ${iconSvg}
      <div class="flex-1">${message}</div>
      <button type="button" class="text-slate-400 hover:text-slate-600 shrink-0" onclick="this.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

window.Validation = Validation;
