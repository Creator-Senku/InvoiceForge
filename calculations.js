/**
 * InvoiceForge Calculations Engine
 * Handles financial calculations, GST breakdowns, line totals, and number-to-words.
 */

const Calculations = {
  /**
   * Round to 2 decimal places reliably
   */
  round(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
  },

  /**
   * Calculate line total for a single item
   */
  calculateLineTotal(quantity, unitPrice) {
    const qty = Math.max(0, parseFloat(quantity) || 0);
    const price = Math.max(0, parseFloat(unitPrice) || 0);
    return this.round(qty * price);
  },

  /**
   * Calculate full invoice totals including subtotal, discount, taxes, and grand total
   */
  calculateInvoiceTotals(invoice) {
    const items = invoice.items || [];
    
    // 1. Calculate item totals and subtotal
    let subtotal = 0;
    const computedItems = items.map(item => {
      const lineTotal = this.calculateLineTotal(item.quantity, item.unitPrice);
      subtotal += lineTotal;
      return {
        ...item,
        lineTotal
      };
    });
    subtotal = this.round(subtotal);

    // 2. Calculate Discount
    const discountType = invoice.discountType || 'percent'; // 'percent' or 'fixed'
    const discountValue = Math.max(0, parseFloat(invoice.discountValue) || 0);
    let discountAmount = 0;

    if (discountType === 'percent') {
      const pct = Math.min(100, discountValue);
      discountAmount = this.round(subtotal * (pct / 100));
    } else {
      discountAmount = this.round(Math.min(subtotal, discountValue));
    }

    // 3. Taxable Amount
    const taxableAmount = Math.max(0, this.round(subtotal - discountAmount));

    // 4. Tax / GST Calculation
    const taxRate = Math.max(0, parseFloat(invoice.taxRate) || 0);
    const taxType = invoice.taxType || 'cgst_sgst'; // 'none', 'cgst_sgst', 'igst', 'flat'

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;
    let flatTaxAmount = 0;
    let totalTax = 0;

    if (taxType === 'cgst_sgst' && taxRate > 0) {
      cgstRate = this.round(taxRate / 2);
      sgstRate = this.round(taxRate / 2);
      cgstAmount = this.round(taxableAmount * (cgstRate / 100));
      sgstAmount = this.round(taxableAmount * (sgstRate / 100));
      totalTax = this.round(cgstAmount + sgstAmount);
    } else if (taxType === 'igst' && taxRate > 0) {
      igstRate = taxRate;
      igstAmount = this.round(taxableAmount * (igstRate / 100));
      totalTax = igstAmount;
    } else if (taxType === 'flat' && taxRate > 0) {
      flatTaxAmount = this.round(taxableAmount * (taxRate / 100));
      totalTax = flatTaxAmount;
    } else {
      totalTax = 0;
    }

    // 5. Grand Total
    const grandTotal = this.round(taxableAmount + totalTax);

    return {
      computedItems,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxableAmount,
      taxRate,
      taxType,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      flatTaxAmount,
      totalTax,
      grandTotal,
      grandTotalInWords: this.numberToWords(grandTotal, invoice.currency || 'INR')
    };
  },

  /**
   * Currency Symbols Mapping
   */
  currencySymbols: {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    AED: 'AED ',
    JPY: '¥'
  },

  /**
   * Format numbers into clean localized currency string
   */
  formatCurrency(amount, currencyCode = 'INR', includeSymbol = true) {
    const val = parseFloat(amount) || 0;
    const symbol = this.currencySymbols[currencyCode] || currencyCode + ' ';

    let formatted = '';
    if (currencyCode === 'INR') {
      // Indian numbering format (lakhs, crores)
      formatted = val.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      formatted = val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    return includeSymbol ? `${symbol}${formatted}` : formatted;
  },

  /**
   * Convert number to words (English words with support for INR lakhs/crores or standard Millions)
   */
  numberToWords(num, currency = 'INR') {
    if (isNaN(num) || num === 0) return 'Zero';

    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numString = num.toFixed(2);
    const [wholePartStr, decimalPartStr] = numString.split('.');
    const wholePart = parseInt(wholePartStr, 10);
    const decimalPart = parseInt(decimalPartStr, 10);

    function convertGroup(n) {
      if (n === 0) return '';
      if (n < 20) return a[n] + ' ';
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
      return a[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? convertGroup(n % 100) : '');
    }

    let words = '';

    if (currency === 'INR') {
      // Indian Numbering System (Crore, Lakh, Thousand, Hundred)
      let n = wholePart;
      const crore = Math.floor(n / 10000000);
      n %= 10000000;
      const lakh = Math.floor(n / 100000);
      n %= 100000;
      const thousand = Math.floor(n / 1000);
      n %= 1000;
      const remainder = n;

      if (crore > 0) words += convertGroup(crore) + 'Crore ';
      if (lakh > 0) words += convertGroup(lakh) + 'Lakh ';
      if (thousand > 0) words += convertGroup(thousand) + 'Thousand ';
      if (remainder > 0) words += convertGroup(remainder);

      words = words.trim() + ' Rupees';
      if (decimalPart > 0) {
        words += ' and ' + convertGroup(decimalPart).trim() + ' Paise';
      }
      words += ' Only';
    } else {
      // Standard Western Numbering (Million, Thousand, Hundred)
      let n = wholePart;
      const billion = Math.floor(n / 1000000000);
      n %= 1000000000;
      const million = Math.floor(n / 1000000);
      n %= 1000000;
      const thousand = Math.floor(n / 1000);
      n %= 1000;
      const remainder = n;

      if (billion > 0) words += convertGroup(billion) + 'Billion ';
      if (million > 0) words += convertGroup(million) + 'Million ';
      if (thousand > 0) words += convertGroup(thousand) + 'Thousand ';
      if (remainder > 0) words += convertGroup(remainder);

      const currencyName = currency === 'USD' ? 'Dollars' : currency === 'EUR' ? 'Euros' : currency === 'GBP' ? 'Pounds' : currency;
      words = words.trim() + ` ${currencyName}`;
      if (decimalPart > 0) {
        words += ' and ' + convertGroup(decimalPart).trim() + ' Cents';
      }
      words += ' Only';
    }

    return words.replace(/\s+/g, ' ').trim();
  }
};

// Export for usage
window.Calculations = Calculations;
