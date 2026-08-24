/**
 * InvoiceForge Template Rendering Engine
 * Generates clean, professional A4 HTML for Minimal, Business, and Modern templates.
 */

const Templates = {
  /**
   * Main render dispatch method
   */
  render(invoice, totals) {
    const templateName = invoice.template || 'minimal';
    switch (templateName) {
      case 'business':
        return this.renderBusiness(invoice, totals);
      case 'modern':
        return this.renderModern(invoice, totals);
      case 'minimal':
      default:
        return this.renderMinimal(invoice, totals);
    }
  },

  /**
   * Helper: Escape HTML strings safely
   */
  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  },

  /**
   * Helper: Escape HTML attribute strings safely without inserting line breaks
   */
  escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Helper: Format Date
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  // =========================================================================
  // 1. MINIMAL TEMPLATE (Clean, Modern Monochrome Swiss Style)
  // =========================================================================
  renderMinimal(invoice, totals) {
    const b = invoice.business || {};
    const c = invoice.customer || {};
    const curr = invoice.currency || 'INR';

    return `
      <div class="template-minimal text-slate-900 text-xs leading-relaxed">
        <!-- Top Bar: Logo & Invoice Meta -->
        <div class="flex justify-between items-start pb-6 border-b border-slate-200">
          <div>
            ${b.logo ? `<img src="${b.logo}" alt="Logo" class="h-12 w-auto max-w-[180px] object-contain mb-3" />` : ''}
            <h1 class="text-xl font-bold text-slate-900 tracking-tight">${this.escape(b.name) || 'Your Business Name'}</h1>
            ${b.address ? `<p class="text-slate-500 mt-1 max-w-xs">${this.escape(b.address)}</p>` : ''}
            <div class="text-slate-500 mt-1 space-y-0.5">
              ${b.phone ? `<p>Phone: ${this.escape(b.phone)}</p>` : ''}
              ${b.email ? `<p>Email: ${this.escape(b.email)}</p>` : ''}
              ${b.gstin ? `<p class="font-medium text-slate-700">GSTIN: <span class="font-mono">${this.escape(b.gstin)}</span></p>` : ''}
            </div>
          </div>

          <div class="text-right">
            <div class="text-3xl font-extrabold tracking-widest text-slate-900 uppercase mb-2">INVOICE</div>
            <p class="font-mono text-sm font-semibold text-slate-800">${this.escape(invoice.invoiceNumber)}</p>
            
            <div class="mt-3 space-y-1 text-slate-600">
              <p><span class="text-slate-400">Date:</span> ${this.formatDate(invoice.invoiceDate)}</p>
              <p><span class="text-slate-400">Due Date:</span> ${this.formatDate(invoice.dueDate)}</p>
              <div class="mt-2">
                <span class="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${invoice.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${invoice.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Billed To Section -->
        <div class="py-6 border-b border-slate-200 grid grid-cols-2 gap-6">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To</span>
            <h3 class="text-sm font-bold text-slate-900 mt-1">${this.escape(c.name) || 'Customer Name'}</h3>
            ${c.company ? `<p class="font-medium text-slate-700">${this.escape(c.company)}</p>` : ''}
            ${c.address ? `<p class="text-slate-500 mt-1">${this.escape(c.address)}</p>` : ''}
            ${c.phone ? `<p class="text-slate-500 mt-0.5">Phone: ${this.escape(c.phone)}</p>` : ''}
            ${c.email ? `<p class="text-slate-500">Email: ${this.escape(c.email)}</p>` : ''}
            ${c.gstin ? `<p class="text-slate-700 mt-1 font-medium">GSTIN: <span class="font-mono">${this.escape(c.gstin)}</span></p>` : ''}
          </div>

          <div class="text-right">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount Due</span>
            <div class="text-2xl font-bold text-slate-900 font-mono mt-1">
              ${Calculations.formatCurrency(totals.grandTotal, curr)}
            </div>
            <p class="text-slate-400 text-[11px] mt-0.5">Due by ${this.formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="py-6">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b-2 border-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <th class="py-2.5 pr-2 w-10">#</th>
                <th class="py-2.5 px-2">Item Description</th>
                <th class="py-2.5 px-2 text-right w-20">Qty</th>
                <th class="py-2.5 px-2 text-right w-28">Rate</th>
                <th class="py-2.5 pl-2 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${totals.computedItems.map((item, idx) => `
                <tr class="align-top">
                  <td class="py-3 pr-2 text-slate-400 font-mono">${idx + 1}</td>
                  <td class="py-3 px-2">
                    <p class="font-semibold text-slate-900">${this.escape(item.name) || 'Item Description'}</p>
                    ${item.description ? `<p class="text-slate-500 text-[11px] mt-0.5">${this.escape(item.description)}</p>` : ''}
                  </td>
                  <td class="py-3 px-2 text-right font-mono text-slate-700">${item.quantity}</td>
                  <td class="py-3 px-2 text-right font-mono text-slate-700">${Calculations.formatCurrency(item.unitPrice, curr)}</td>
                  <td class="py-3 pl-2 text-right font-mono font-semibold text-slate-900">${Calculations.formatCurrency(item.lineTotal, curr)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals & Summary Breakdown -->
        <div class="border-t border-slate-200 pt-4 grid grid-cols-12 gap-6">
          <!-- Left: Notes & Banking -->
          <div class="col-span-7 space-y-4">
            ${invoice.notes ? `
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</span>
                <p class="text-slate-600 text-[11px] mt-1">${this.escape(invoice.notes)}</p>
              </div>
            ` : ''}

            ${invoice.paymentInstructions ? `
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Instructions</span>
                <div class="text-slate-600 text-[11px] font-mono mt-1 p-2.5 bg-slate-50 rounded border border-slate-100">${this.escape(invoice.paymentInstructions)}</div>
              </div>
            ` : ''}

            ${totals.grandTotalInWords ? `
              <div class="pt-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount in Words</span>
                <p class="text-slate-700 text-[11px] italic mt-0.5">${totals.grandTotalInWords}</p>
              </div>
            ` : ''}
          </div>

          <!-- Right: Mathematical Totals -->
          <div class="col-span-5 space-y-2 text-right">
            <div class="flex justify-between py-1 text-slate-600">
              <span>Subtotal:</span>
              <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.subtotal, curr)}</span>
            </div>

            ${totals.discountAmount > 0 ? `
              <div class="flex justify-between py-1 text-emerald-700">
                <span>Discount ${totals.discountType === 'percent' ? `(${totals.discountValue}%)` : ''}:</span>
                <span class="font-mono">- ${Calculations.formatCurrency(totals.discountAmount, curr)}</span>
              </div>
            ` : ''}

            ${totals.taxType === 'cgst_sgst' && totals.totalTax > 0 ? `
              <div class="flex justify-between py-1 text-slate-600 text-[11px]">
                <span>CGST (${totals.cgstRate}%):</span>
                <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.cgstAmount, curr)}</span>
              </div>
              <div class="flex justify-between py-1 text-slate-600 text-[11px]">
                <span>SGST (${totals.sgstRate}%):</span>
                <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.sgstAmount, curr)}</span>
              </div>
            ` : ''}

            ${totals.taxType === 'igst' && totals.totalTax > 0 ? `
              <div class="flex justify-between py-1 text-slate-600 text-[11px]">
                <span>IGST (${totals.igstRate}%):</span>
                <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.igstAmount, curr)}</span>
              </div>
            ` : ''}

            ${totals.taxType === 'flat' && totals.totalTax > 0 ? `
              <div class="flex justify-between py-1 text-slate-600 text-[11px]">
                <span>Tax (${totals.taxRate}%):</span>
                <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.flatTaxAmount, curr)}</span>
              </div>
            ` : ''}

            <div class="flex justify-between items-center py-2.5 border-t-2 border-slate-900 mt-2">
              <span class="text-sm font-bold text-slate-900 uppercase">Grand Total:</span>
              <span class="text-base font-extrabold text-slate-900 font-mono">${Calculations.formatCurrency(totals.grandTotal, curr)}</span>
            </div>
          </div>
        </div>

        <!-- Terms Footer -->
        ${invoice.terms ? `
          <div class="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400">
            <span class="font-bold uppercase tracking-wider text-slate-500">Terms & Conditions:</span>
            <p class="mt-0.5">${this.escape(invoice.terms)}</p>
          </div>
        ` : ''}
      </div>
    `;
  },

  // =========================================================================
  // 2. BUSINESS TEMPLATE (Corporate Navy Header & Structured Grid)
  // =========================================================================
  renderBusiness(invoice, totals) {
    const b = invoice.business || {};
    const c = invoice.customer || {};
    const curr = invoice.currency || 'INR';

    return `
      <div class="template-business text-slate-900 text-xs leading-relaxed">
        <!-- Top Navy Banner -->
        <div class="bg-slate-900 text-white p-6 -mx-6 -mt-6 rounded-t-lg flex justify-between items-center mb-6">
          <div class="flex items-center gap-4">
            ${b.logo ? `<img src="${b.logo}" alt="Logo" class="h-12 w-auto max-w-[160px] object-contain bg-white/10 p-1.5 rounded" />` : ''}
            <div>
              <h1 class="text-xl font-bold tracking-tight text-white">${this.escape(b.name) || 'Business Name'}</h1>
              <p class="text-slate-400 text-[11px]">${b.website ? this.escape(b.website) : ''}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-black tracking-widest text-indigo-400 uppercase">TAX INVOICE</div>
            <p class="font-mono text-sm font-semibold text-slate-200 mt-0.5"># ${this.escape(invoice.invoiceNumber)}</p>
          </div>
        </div>

        <!-- Info Boxes Grid -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <!-- Billed From -->
          <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">From / Seller</span>
            <h4 class="font-bold text-slate-900 text-xs">${this.escape(b.name) || 'Business Name'}</h4>
            ${b.address ? `<p class="text-slate-600 text-[11px] mt-1">${this.escape(b.address)}</p>` : ''}
            ${b.phone ? `<p class="text-slate-600 text-[11px] mt-0.5">Tel: ${this.escape(b.phone)}</p>` : ''}
            ${b.email ? `<p class="text-slate-600 text-[11px]">Email: ${this.escape(b.email)}</p>` : ''}
            ${b.gstin ? `<p class="text-slate-800 text-[11px] font-semibold mt-1">GSTIN: <span class="font-mono">${this.escape(b.gstin)}</span></p>` : ''}
          </div>

          <!-- Billed To -->
          <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">To / Buyer</span>
            <h4 class="font-bold text-slate-900 text-xs">${this.escape(c.name) || 'Customer Name'}</h4>
            ${c.company ? `<p class="font-semibold text-slate-700 text-[11px]">${this.escape(c.company)}</p>` : ''}
            ${c.address ? `<p class="text-slate-600 text-[11px] mt-1">${this.escape(c.address)}</p>` : ''}
            ${c.phone ? `<p class="text-slate-600 text-[11px] mt-0.5">Tel: ${this.escape(c.phone)}</p>` : ''}
            ${c.email ? `<p class="text-slate-600 text-[11px]">Email: ${this.escape(c.email)}</p>` : ''}
            ${c.gstin ? `<p class="text-slate-800 text-[11px] font-semibold mt-1">GSTIN: <span class="font-mono">${this.escape(c.gstin)}</span></p>` : ''}
          </div>

          <!-- Dates & Status -->
          <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">Invoice Details</span>
              <div class="space-y-1 text-[11px] text-slate-700">
                <div class="flex justify-between">
                  <span class="text-slate-500">Invoice Date:</span>
                  <span class="font-semibold">${this.formatDate(invoice.invoiceDate)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Payment Due:</span>
                  <span class="font-semibold text-rose-700">${this.formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center">
              <span class="text-[10px] uppercase font-bold text-slate-500">Status:</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${invoice.paymentStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}">
                ${invoice.paymentStatus === 'paid' ? 'PAID' : 'PAYMENT PENDING'}
              </span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="mb-6 overflow-hidden rounded-lg border border-slate-200">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider">
                <th class="py-2.5 px-3 w-10 text-center">#</th>
                <th class="py-2.5 px-3">Item / Service Details</th>
                <th class="py-2.5 px-3 text-right w-20">Qty</th>
                <th class="py-2.5 px-3 text-right w-28">Unit Price</th>
                <th class="py-2.5 px-3 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              ${totals.computedItems.map((item, idx) => `
                <tr class="${idx % 2 === 1 ? 'bg-slate-50/60' : ''}">
                  <td class="py-2.5 px-3 text-center text-slate-500 font-mono">${idx + 1}</td>
                  <td class="py-2.5 px-3">
                    <p class="font-bold text-slate-900">${this.escape(item.name) || 'Item Name'}</p>
                    ${item.description ? `<p class="text-slate-500 text-[11px] mt-0.5">${this.escape(item.description)}</p>` : ''}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-slate-700">${item.quantity}</td>
                  <td class="py-2.5 px-3 text-right font-mono text-slate-700">${Calculations.formatCurrency(item.unitPrice, curr)}</td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">${Calculations.formatCurrency(item.lineTotal, curr)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Summary & Totals -->
        <div class="grid grid-cols-12 gap-6 items-start">
          <div class="col-span-6 space-y-3">
            ${invoice.paymentInstructions ? `
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">Banking & Remittance</span>
                <p class="text-slate-600 text-[11px] font-mono whitespace-pre-line">${this.escape(invoice.paymentInstructions)}</p>
              </div>
            ` : ''}

            ${totals.grandTotalInWords ? `
              <div class="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Words:</span>
                <p class="font-medium text-slate-800 italic mt-0.5">${totals.grandTotalInWords}</p>
              </div>
            ` : ''}

            ${invoice.notes ? `
              <div class="text-[11px] text-slate-600">
                <span class="font-bold text-slate-700">Note:</span> ${this.escape(invoice.notes)}
              </div>
            ` : ''}
          </div>

          <div class="col-span-6">
            <div class="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
              <div class="flex justify-between text-slate-700 text-xs">
                <span>Subtotal:</span>
                <span class="font-mono font-semibold">${Calculations.formatCurrency(totals.subtotal, curr)}</span>
              </div>

              ${totals.discountAmount > 0 ? `
                <div class="flex justify-between text-emerald-700 text-xs">
                  <span>Discount ${totals.discountType === 'percent' ? `(${totals.discountValue}%)` : ''}:</span>
                  <span class="font-mono font-semibold">- ${Calculations.formatCurrency(totals.discountAmount, curr)}</span>
                </div>
              ` : ''}

              ${totals.taxType === 'cgst_sgst' && totals.totalTax > 0 ? `
                <div class="flex justify-between text-slate-600 text-[11px]">
                  <span>CGST (${totals.cgstRate}%):</span>
                  <span class="font-mono">${Calculations.formatCurrency(totals.cgstAmount, curr)}</span>
                </div>
                <div class="flex justify-between text-slate-600 text-[11px]">
                  <span>SGST (${totals.sgstRate}%):</span>
                  <span class="font-mono">${Calculations.formatCurrency(totals.sgstAmount, curr)}</span>
                </div>
              ` : ''}

              ${totals.taxType === 'igst' && totals.totalTax > 0 ? `
                <div class="flex justify-between text-slate-600 text-[11px]">
                  <span>IGST (${totals.igstRate}%):</span>
                  <span class="font-mono">${Calculations.formatCurrency(totals.igstAmount, curr)}</span>
                </div>
              ` : ''}

              ${totals.taxType === 'flat' && totals.totalTax > 0 ? `
                <div class="flex justify-between text-slate-600 text-[11px]">
                  <span>Tax (${totals.taxRate}%):</span>
                  <span class="font-mono">${Calculations.formatCurrency(totals.flatTaxAmount, curr)}</span>
                </div>
              ` : ''}

              <div class="border-t-2 border-slate-800 pt-2.5 mt-2 flex justify-between items-center text-slate-900">
                <span class="font-black text-sm uppercase">Total Due:</span>
                <span class="font-black font-mono text-lg text-indigo-950">${Calculations.formatCurrency(totals.grandTotal, curr)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Terms -->
        ${invoice.terms ? `
          <div class="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-400">
            <span class="font-bold text-slate-500">Terms:</span> ${this.escape(invoice.terms)}
          </div>
        ` : ''}
      </div>
    `;
  },

  // =========================================================================
  // 3. MODERN TEMPLATE (Gradient Accents, Pill Badges, Card Flow)
  // =========================================================================
  renderModern(invoice, totals) {
    const b = invoice.business || {};
    const c = invoice.customer || {};
    const curr = invoice.currency || 'INR';

    return `
      <div class="template-modern text-slate-800 text-xs leading-relaxed">
        <!-- Top Gradient Accent Header -->
        <div class="flex justify-between items-start pb-6 border-b border-indigo-100">
          <div class="space-y-2">
            ${b.logo ? `<img src="${b.logo}" alt="Logo" class="h-12 w-auto max-w-[180px] object-contain mb-1" />` : ''}
            <div>
              <h1 class="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                ${this.escape(b.name) || 'Apex Studio'}
              </h1>
              ${b.address ? `<p class="text-slate-500 text-[11px] mt-0.5 max-w-sm">${this.escape(b.address)}</p>` : ''}
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
              ${b.phone ? `<span>📞 ${this.escape(b.phone)}</span>` : ''}
              ${b.email ? `<span>✉️ ${this.escape(b.email)}</span>` : ''}
              ${b.gstin ? `<span class="font-semibold text-slate-700">GSTIN: <span class="font-mono">${this.escape(b.gstin)}</span></span>` : ''}
            </div>
          </div>

          <div class="text-right flex flex-col items-end">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full mb-2">
              <span class="w-2 h-2 rounded-full ${invoice.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
              <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-950">
                ${invoice.paymentStatus === 'paid' ? 'PAID INVOICE' : 'UNPAID INVOICE'}
              </span>
            </div>
            
            <div class="text-2xl font-black font-mono text-slate-900 tracking-tight">
              ${this.escape(invoice.invoiceNumber)}
            </div>

            <div class="mt-2 text-[11px] space-y-0.5 text-slate-500">
              <div><span class="font-medium text-slate-400">Issued:</span> ${this.formatDate(invoice.invoiceDate)}</div>
              <div><span class="font-medium text-slate-400">Due:</span> <span class="font-semibold text-indigo-900">${this.formatDate(invoice.dueDate)}</span></div>
            </div>
          </div>
        </div>

        <!-- Client & Quick Details -->
        <div class="my-6 grid grid-cols-12 gap-4">
          <div class="col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Invoiced To</span>
            <h3 class="text-sm font-bold text-slate-900 mt-1">${this.escape(c.name) || 'Customer Name'}</h3>
            ${c.company ? `<p class="font-semibold text-slate-700 text-xs">${this.escape(c.company)}</p>` : ''}
            ${c.address ? `<p class="text-slate-500 text-[11px] mt-1">${this.escape(c.address)}</p>` : ''}
            <div class="flex flex-wrap gap-x-3 text-[11px] text-slate-500 mt-1">
              ${c.phone ? `<span>${this.escape(c.phone)}</span>` : ''}
              ${c.email ? `<span>${this.escape(c.email)}</span>` : ''}
            </div>
            ${c.gstin ? `<p class="text-slate-700 text-[11px] font-medium mt-1.5">GSTIN: <span class="font-mono">${this.escape(c.gstin)}</span></p>` : ''}
          </div>

          <div class="col-span-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-4 rounded-xl flex flex-col justify-between shadow-md">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Total Amount Due</span>
              <div class="text-2xl font-black font-mono mt-1 text-white tracking-tight">
                ${Calculations.formatCurrency(totals.grandTotal, curr)}
              </div>
            </div>
            <div class="text-[11px] text-indigo-200 pt-2 border-t border-indigo-400/30 flex justify-between">
              <span>Payment Term:</span>
              <span class="font-bold text-white">Net 15 Days</span>
            </div>
          </div>
        </div>

        <!-- Modern Table -->
        <div class="mb-6 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                <th class="py-3 px-3 w-8 text-center">#</th>
                <th class="py-3 px-3">Description</th>
                <th class="py-3 px-3 text-right w-16">Qty</th>
                <th class="py-3 px-3 text-right w-24">Price</th>
                <th class="py-3 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${totals.computedItems.map((item, idx) => `
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="py-3 px-3 text-center text-slate-400 font-mono">${idx + 1}</td>
                  <td class="py-3 px-3">
                    <p class="font-bold text-slate-900">${this.escape(item.name) || 'Item Name'}</p>
                    ${item.description ? `<p class="text-slate-500 text-[11px] mt-0.5">${this.escape(item.description)}</p>` : ''}
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-slate-700">${item.quantity}</td>
                  <td class="py-3 px-3 text-right font-mono text-slate-700">${Calculations.formatCurrency(item.unitPrice, curr)}</td>
                  <td class="py-3 px-3 text-right font-mono font-bold text-slate-900">${Calculations.formatCurrency(item.lineTotal, curr)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Summary & Notes -->
        <div class="grid grid-cols-12 gap-6 items-start">
          <div class="col-span-7 space-y-3">
            ${invoice.paymentInstructions ? `
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">Payment Method & Details</span>
                <p class="text-slate-600 font-mono whitespace-pre-line">${this.escape(invoice.paymentInstructions)}</p>
              </div>
            ` : ''}

            ${totals.grandTotalInWords ? `
              <div class="text-[11px] text-slate-600 italic">
                <span class="font-semibold text-slate-700 not-italic">Amount in Words:</span> ${totals.grandTotalInWords}
              </div>
            ` : ''}

            ${invoice.notes ? `
              <div class="text-[11px] text-slate-500">
                <span class="font-semibold text-slate-700">Note:</span> ${this.escape(invoice.notes)}
              </div>
            ` : ''}
          </div>

          <div class="col-span-5 space-y-2">
            <div class="flex justify-between text-slate-600 text-xs py-1">
              <span>Subtotal:</span>
              <span class="font-mono font-semibold text-slate-800">${Calculations.formatCurrency(totals.subtotal, curr)}</span>
            </div>

            ${totals.discountAmount > 0 ? `
              <div class="flex justify-between text-emerald-600 text-xs py-1">
                <span>Discount (${totals.discountType === 'percent' ? `${totals.discountValue}%` : 'Flat'}):</span>
                <span class="font-mono font-semibold">- ${Calculations.formatCurrency(totals.discountAmount, curr)}</span>
              </div>
            ` : ''}

            ${totals.taxType === 'cgst_sgst' && totals.totalTax > 0 ? `
              <div class="flex justify-between text-slate-500 text-[11px] py-0.5">
                <span>CGST (${totals.cgstRate}%):</span>
                <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.cgstAmount, curr)}</span>
              </div>
              <div class="flex justify-between text-slate-500 text-[11px] py-0.5">
                <span>SGST (${totals.sgstRate}%):</span>
                <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.sgstAmount, curr)}</span>
              </div>
            ` : ''}

            ${totals.taxType === 'igst' && totals.totalTax > 0 ? `
              <div class="flex justify-between text-slate-500 text-[11px] py-0.5">
                <span>IGST (${totals.igstRate}%):</span>
                <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.igstAmount, curr)}</span>
              </div>
            ` : ''}

            ${totals.taxType === 'flat' && totals.totalTax > 0 ? `
              <div class="flex justify-between text-slate-500 text-[11px] py-0.5">
                <span>Tax (${totals.taxRate}%):</span>
                <span class="font-mono text-slate-800">${Calculations.formatCurrency(totals.flatTaxAmount, curr)}</span>
              </div>
            ` : ''}

            <div class="flex justify-between items-center pt-3 border-t-2 border-indigo-500 mt-2">
              <span class="font-black text-sm text-slate-900 uppercase">Grand Total:</span>
              <span class="font-black font-mono text-lg text-indigo-700">${Calculations.formatCurrency(totals.grandTotal, curr)}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        ${invoice.terms ? `
          <div class="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            <span class="font-bold text-slate-500">Terms:</span> ${this.escape(invoice.terms)}
          </div>
        ` : ''}
      </div>
    `;
  }
};

window.Templates = Templates;
