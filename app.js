/**
 * InvoiceForge Main Application Orchestrator
 * Connects UI, forms, state, storage, calculations, templates, validation, and PDF engine.
 */

const App = {
  // Initialization
  init() {
    console.log('[InvoiceForge] Initializing application...');

    // Load saved settings or defaults
    this.loadSettings();

    // Check for draft or create initial invoice
    const draft = Storage.getDraft();
    const businessProfile = Storage.getBusinessProfile();

    if (draft) {
      State.activeInvoice = draft;
    } else {
      State.activeInvoice = State.createBlankInvoice(Storage.getNextInvoiceNumber());
      // Apply business profile default if available
      if (businessProfile) {
        State.activeInvoice.business = { ...businessProfile };
      }
    }

    // Bind event listeners
    this.bindEvents();

    // Populate initial form fields
    this.populateForm(State.activeInvoice);

    // Initial render
    this.updatePreview();
    this.renderHistory();
    this.renderDashboard();
    this.populateSettings();

    // Default tab
    this.switchView('create');

    console.log('[InvoiceForge] Ready!');
  },

  // ==========================================
  // VIEW ROUTING
  // ==========================================

  switchView(viewName) {
    State.currentView = viewName;

    // Toggle view containers
    const views = ['dashboard', 'create', 'history', 'settings'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) {
        if (v === viewName) {
          el.classList.remove('hidden');
          el.classList.add('fade-in');
        } else {
          el.classList.add('hidden');
          el.classList.remove('fade-in');
        }
      }
    });

    // Update navigation active styles
    document.querySelectorAll('.nav-link').forEach(link => {
      const target = link.getAttribute('data-view');
      if (target === viewName) {
        link.classList.add('bg-indigo-600', 'text-white');
        link.classList.remove('text-slate-600', 'hover:bg-slate-100');
      } else {
        link.classList.remove('bg-indigo-600', 'text-white');
        link.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    });

    // Refresh view data
    if (viewName === 'dashboard') {
      this.renderDashboard();
    } else if (viewName === 'history') {
      this.renderHistory();
    } else if (viewName === 'settings') {
      this.populateSettings();
    }
  },

  // ==========================================
  // EVENT BINDINGS
  // ==========================================

  bindEvents() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        if (view) this.switchView(view);
      });
    });

    // Mobile View Toggle (Editor vs Preview)
    const toggleEditorBtn = document.getElementById('btn-show-editor');
    const togglePreviewBtn = document.getElementById('btn-show-preview');
    const editorCol = document.getElementById('editor-column');
    const previewCol = document.getElementById('preview-column');

    if (toggleEditorBtn && togglePreviewBtn && editorCol && previewCol) {
      toggleEditorBtn.addEventListener('click', () => {
        editorCol.classList.remove('hidden');
        previewCol.classList.add('hidden');
        toggleEditorBtn.classList.add('bg-indigo-600', 'text-white');
        toggleEditorBtn.classList.remove('bg-slate-200', 'text-slate-700');
        togglePreviewBtn.classList.remove('bg-indigo-600', 'text-white');
        togglePreviewBtn.classList.add('bg-slate-200', 'text-slate-700');
      });

      togglePreviewBtn.addEventListener('click', () => {
        editorCol.classList.add('hidden');
        previewCol.classList.remove('hidden');
        togglePreviewBtn.classList.add('bg-indigo-600', 'text-white');
        togglePreviewBtn.classList.remove('bg-slate-200', 'text-slate-700');
        toggleEditorBtn.classList.remove('bg-indigo-600', 'text-white');
        toggleEditorBtn.classList.add('bg-slate-200', 'text-slate-700');
      });
    }

    // Live form changes sync
    const form = document.getElementById('invoice-form');
    if (form) {
      form.addEventListener('input', () => this.syncFromForm());
      form.addEventListener('change', () => this.syncFromForm());
    }

    // Template selector buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tpl = btn.getAttribute('data-template');
        if (tpl) {
          State.activeInvoice.template = tpl;
          this.updateTemplateButtons(tpl);
          this.updatePreview();
        }
      });
    });

    // Add item button
    const addItemBtn = document.getElementById('btn-add-item');
    if (addItemBtn) {
      addItemBtn.addEventListener('click', () => this.addItem());
    }

    // Top action bar buttons
    document.getElementById('btn-new-invoice')?.addEventListener('click', () => this.createNewInvoice());
    document.getElementById('btn-load-sample')?.addEventListener('click', () => this.loadSampleData());
    document.getElementById('btn-save-invoice')?.addEventListener('click', () => this.saveCurrentInvoice());
    document.getElementById('btn-download-pdf')?.addEventListener('click', () => this.downloadInvoicePDF());
    document.getElementById('btn-print-invoice')?.addEventListener('click', () => this.printInvoice());

    // Logo Upload & Drag-Drop
    const logoDropZone = document.getElementById('logo-dropzone');
    const logoInput = document.getElementById('business-logo-input');
    const logoRemoveBtn = document.getElementById('btn-remove-logo');

    if (logoDropZone && logoInput) {
      logoDropZone.addEventListener('click', () => logoInput.click());

      logoDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        logoDropZone.classList.add('border-indigo-500', 'bg-indigo-50/50');
      });

      logoDropZone.addEventListener('dragleave', () => {
        logoDropZone.classList.remove('border-indigo-500', 'bg-indigo-50/50');
      });

      logoDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        logoDropZone.classList.remove('border-indigo-500', 'bg-indigo-50/50');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleLogoFile(e.dataTransfer.files[0]);
        }
      });

      logoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleLogoFile(e.target.files[0]);
        }
      });
    }

    if (logoRemoveBtn) {
      logoRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        State.activeInvoice.business.logo = '';
        this.updateLogoDisplay('');
        this.updatePreview();
      });
    }

    // Save as default business profile
    document.getElementById('btn-save-business-default')?.addEventListener('click', () => {
      this.syncFromForm();
      Storage.saveBusinessProfile(State.activeInvoice.business);
      Validation.showToast('Business details saved as default profile!', 'success');
    });

    // History search and filters
    document.getElementById('history-search')?.addEventListener('input', (e) => {
      State.historyFilter.search = e.target.value.toLowerCase();
      this.renderHistory();
    });

    document.getElementById('history-status-filter')?.addEventListener('change', (e) => {
      State.historyFilter.status = e.target.value;
      this.renderHistory();
    });

    document.getElementById('history-sort-by')?.addEventListener('change', (e) => {
      State.historyFilter.sortBy = e.target.value;
      this.renderHistory();
    });

    // Settings save & actions
    document.getElementById('form-settings')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettingsFromForm();
    });

    document.getElementById('btn-export-backup')?.addEventListener('click', () => this.exportBackup());
    document.getElementById('backup-file-input')?.addEventListener('change', (e) => this.importBackup(e));
    document.getElementById('btn-clear-all-data')?.addEventListener('click', () => this.confirmClearAll());
  },

  // ==========================================
  // FORM & STATE SYNC
  // ==========================================

  populateForm(inv) {
    if (!inv) return;

    // Meta & Details
    document.getElementById('invoice-number').value = inv.invoiceNumber || '';
    document.getElementById('invoice-date').value = inv.invoiceDate || '';
    document.getElementById('invoice-due-date').value = inv.dueDate || '';
    document.getElementById('invoice-currency').value = inv.currency || 'INR';
    document.getElementById('invoice-status').value = inv.paymentStatus || 'unpaid';

    // Business
    const b = inv.business || {};
    document.getElementById('business-name').value = b.name || '';
    document.getElementById('business-address').value = b.address || '';
    document.getElementById('business-phone').value = b.phone || '';
    document.getElementById('business-email').value = b.email || '';
    document.getElementById('business-gstin').value = b.gstin || '';
    document.getElementById('business-website').value = b.website || '';
    this.updateLogoDisplay(b.logo || '');

    // Customer
    const c = inv.customer || {};
    document.getElementById('customer-name').value = c.name || '';
    document.getElementById('customer-company').value = c.company || '';
    document.getElementById('customer-address').value = c.address || '';
    document.getElementById('customer-phone').value = c.phone || '';
    document.getElementById('customer-email').value = c.email || '';
    document.getElementById('customer-gstin').value = c.gstin || '';

    // Items
    this.renderItemRows(inv.items || []);

    // Discount & Tax
    document.getElementById('discount-type').value = inv.discountType || 'percent';
    document.getElementById('discount-value').value = inv.discountValue ?? 0;
    document.getElementById('tax-slab').value = inv.taxRate !== undefined ? inv.taxRate : 18;
    document.getElementById('tax-type').value = inv.taxType || 'cgst_sgst';

    // Handle custom tax rate field visibility
    const customTaxContainer = document.getElementById('custom-tax-container');
    const taxSlabVal = document.getElementById('tax-slab').value;
    if (taxSlabVal === 'custom') {
      customTaxContainer.classList.remove('hidden');
      document.getElementById('tax-rate-custom').value = inv.taxRate || 0;
    } else {
      customTaxContainer.classList.add('hidden');
    }

    // Notes & Payment
    document.getElementById('invoice-notes').value = inv.notes || '';
    document.getElementById('invoice-payment-instructions').value = inv.paymentInstructions || '';
    document.getElementById('invoice-terms').value = inv.terms || '';

    // Template buttons
    this.updateTemplateButtons(inv.template || 'minimal');
  },

  syncFromForm() {
    const inv = State.activeInvoice;
    if (!inv) return;

    // Meta
    inv.invoiceNumber = document.getElementById('invoice-number').value.trim();
    inv.invoiceDate = document.getElementById('invoice-date').value;
    inv.dueDate = document.getElementById('invoice-due-date').value;
    inv.currency = document.getElementById('invoice-currency').value;
    inv.paymentStatus = document.getElementById('invoice-status').value;

    // Business
    inv.business = {
      ...inv.business,
      name: document.getElementById('business-name').value.trim(),
      address: document.getElementById('business-address').value.trim(),
      phone: document.getElementById('business-phone').value.trim(),
      email: document.getElementById('business-email').value.trim(),
      gstin: document.getElementById('business-gstin').value.trim().toUpperCase(),
      website: document.getElementById('business-website').value.trim()
    };

    // Customer
    inv.customer = {
      name: document.getElementById('customer-name').value.trim(),
      company: document.getElementById('customer-company').value.trim(),
      address: document.getElementById('customer-address').value.trim(),
      phone: document.getElementById('customer-phone').value.trim(),
      email: document.getElementById('customer-email').value.trim(),
      gstin: document.getElementById('customer-gstin').value.trim().toUpperCase()
    };

    // Items from DOM
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
      const id = row.getAttribute('data-item-id');
      const name = row.querySelector('.item-name-input').value;
      const description = row.querySelector('.item-desc-input').value;
      const quantity = parseFloat(row.querySelector('.item-qty-input').value) || 0;
      const unitPrice = parseFloat(row.querySelector('.item-price-input').value) || 0;

      // Update line total text in row
      const lineTotal = Calculations.calculateLineTotal(quantity, unitPrice);
      const lineTotalEl = row.querySelector('.item-line-total');
      if (lineTotalEl) {
        lineTotalEl.textContent = Calculations.formatCurrency(lineTotal, inv.currency);
      }

      items.push({ id, name, description, quantity, unitPrice });
    });
    inv.items = items;

    // Discount
    inv.discountType = document.getElementById('discount-type').value;
    inv.discountValue = parseFloat(document.getElementById('discount-value').value) || 0;

    // Tax
    const taxSlabVal = document.getElementById('tax-slab').value;
    const customTaxContainer = document.getElementById('custom-tax-container');

    if (taxSlabVal === 'custom') {
      customTaxContainer.classList.remove('hidden');
      inv.taxRate = parseFloat(document.getElementById('tax-rate-custom').value) || 0;
    } else {
      customTaxContainer.classList.add('hidden');
      inv.taxRate = parseFloat(taxSlabVal) || 0;
    }

    inv.taxType = document.getElementById('tax-type').value;

    // Notes & Payment
    inv.notes = document.getElementById('invoice-notes').value;
    inv.paymentInstructions = document.getElementById('invoice-payment-instructions').value;
    inv.terms = document.getElementById('invoice-terms').value;

    // Save auto-draft
    Storage.saveDraft(inv);

    // Re-render preview
    this.updatePreview();
  },

  // ==========================================
  // LINE ITEMS MANAGEMENT
  // ==========================================

  renderItemRows(items) {
    const container = document.getElementById('items-container');
    if (!container) return;

    if (!items || items.length === 0) {
      items = [{
        id: 'item_' + Date.now(),
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0
      }];
      State.activeInvoice.items = items;
    }

    container.innerHTML = items.map((item, index) => this.generateItemRowHTML(item, index)).join('');
    this.bindItemRowEvents();
  },

  generateItemRowHTML(item, index) {
    const curr = State.activeInvoice?.currency || 'INR';
    const lineTotal = Calculations.calculateLineTotal(item.quantity, item.unitPrice);

    return `
      <div class="item-row p-3 rounded-lg border border-slate-200 bg-white space-y-2 relative group" data-item-id="${item.id || 'item_' + index}">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold text-slate-400 font-mono w-6">#${index + 1}</span>
          <div class="flex-1">
            <input type="text" class="item-name-input w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Item / Service Name (e.g. Web Development)" value="${Templates.escapeAttr(item.name || '')}" />
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="btn-clone-item text-slate-400 hover:text-indigo-600 p-1.5 rounded hover:bg-slate-100" title="Clone Item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button type="button" class="btn-delete-item text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50" title="Delete Item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>

        <div>
          <input type="text" class="item-desc-input w-full px-2.5 py-1 text-[11px] text-slate-600 border border-slate-200 rounded focus:border-indigo-500 outline-none" placeholder="Description / details (optional)" value="${Templates.escapeAttr(item.description || '')}" />
        </div>

        <div class="grid grid-cols-12 gap-2 pt-1 items-center">
          <div class="col-span-4">
            <label class="text-[10px] font-semibold text-slate-500 uppercase">Quantity</label>
            <input type="number" min="0.01" step="any" class="item-qty-input w-full px-2 py-1 text-xs font-mono text-slate-800 border border-slate-200 rounded focus:border-indigo-500 outline-none" value="${item.quantity ?? 1}" />
          </div>

          <div class="col-span-4">
            <label class="text-[10px] font-semibold text-slate-500 uppercase">Unit Price</label>
            <input type="number" min="0" step="any" class="item-price-input w-full px-2 py-1 text-xs font-mono text-slate-800 border border-slate-200 rounded focus:border-indigo-500 outline-none" value="${item.unitPrice ?? 0}" />
          </div>

          <div class="col-span-4 text-right">
            <label class="text-[10px] font-semibold text-slate-500 uppercase">Line Total</label>
            <div class="item-line-total text-xs font-bold font-mono text-slate-900 mt-1">
              ${Calculations.formatCurrency(lineTotal, curr)}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindItemRowEvents() {
    const container = document.getElementById('items-container');
    if (!container) return;

    // Delete item
    container.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.onclick = (e) => {
        const row = e.target.closest('.item-row');
        if (row) {
          const rows = container.querySelectorAll('.item-row');
          if (rows.length <= 1) {
            Validation.showToast('Invoice must have at least one line item', 'warning');
            return;
          }
          row.remove();
          this.syncFromForm();
        }
      };
    });

    // Clone item
    container.querySelectorAll('.btn-clone-item').forEach(btn => {
      btn.onclick = (e) => {
        const row = e.target.closest('.item-row');
        if (row) {
          const name = row.querySelector('.item-name-input').value;
          const description = row.querySelector('.item-desc-input').value;
          const quantity = parseFloat(row.querySelector('.item-qty-input').value) || 1;
          const unitPrice = parseFloat(row.querySelector('.item-price-input').value) || 0;

          const newItem = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name,
            description,
            quantity,
            unitPrice
          };

          State.activeInvoice.items.push(newItem);
          this.renderItemRows(State.activeInvoice.items);
          this.syncFromForm();
          Validation.showToast('Item duplicated', 'info', 1500);
        }
      };
    });
  },

  addItem() {
    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0
    };

    if (!State.activeInvoice.items) State.activeInvoice.items = [];
    State.activeInvoice.items.push(newItem);
    this.renderItemRows(State.activeInvoice.items);
    this.syncFromForm();

    // Focus newly created item input
    setTimeout(() => {
      const rows = document.querySelectorAll('.item-row');
      const lastRow = rows[rows.length - 1];
      lastRow?.querySelector('.item-name-input')?.focus();
    }, 50);
  },

  // ==========================================
  // LOGO UPLOAD & PROCESSING
  // ==========================================

  handleLogoFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      Validation.showToast('Please select a valid image file (PNG, JPG, SVG)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Validation.showToast('Image file size should be less than 2MB', 'warning');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress & scale to max 400px width/height for fast canvas and storage
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 400;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/png', 0.9);
        State.activeInvoice.business.logo = dataUrl;
        this.updateLogoDisplay(dataUrl);
        this.updatePreview();
        Validation.showToast('Business logo uploaded successfully!', 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  updateLogoDisplay(logoUrl) {
    const previewImg = document.getElementById('logo-preview-img');
    const placeholder = document.getElementById('logo-placeholder');
    const removeBtn = document.getElementById('btn-remove-logo');

    if (logoUrl) {
      if (previewImg) {
        previewImg.src = logoUrl;
        previewImg.classList.remove('hidden');
      }
      placeholder?.classList.add('hidden');
      removeBtn?.classList.remove('hidden');
    } else {
      if (previewImg) {
        previewImg.src = '';
        previewImg.classList.add('hidden');
      }
      placeholder?.classList.remove('hidden');
      removeBtn?.classList.add('hidden');
    }
  },

  // ==========================================
  // TEMPLATE SELECTION
  // ==========================================

  updateTemplateButtons(selectedTemplate) {
    document.querySelectorAll('.template-btn').forEach(btn => {
      const tpl = btn.getAttribute('data-template');
      if (tpl === selectedTemplate) {
        btn.classList.add('border-indigo-600', 'bg-indigo-50', 'text-indigo-900', 'font-bold');
        btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
      } else {
        btn.classList.remove('border-indigo-600', 'bg-indigo-50', 'text-indigo-900', 'font-bold');
        btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
      }
    });
  },

  // ==========================================
  // PREVIEW RENDERING
  // ==========================================

  updatePreview() {
    const inv = State.activeInvoice;
    if (!inv) return;

    const totals = Calculations.calculateInvoiceTotals(inv);
    const canvas = document.getElementById('invoice-preview-canvas');

    if (canvas) {
      canvas.innerHTML = Templates.render(inv, totals);
    }
  },

  // ==========================================
  // TOP ACTIONS: NEW, SAMPLE, SAVE, PDF, PRINT
  // ==========================================

  createNewInvoice() {
    const nextNum = Storage.getNextInvoiceNumber();
    const newInv = State.createBlankInvoice(nextNum);

    // Apply default business profile if set
    const businessProfile = Storage.getBusinessProfile();
    if (businessProfile) {
      newInv.business = { ...businessProfile };
    }

    State.activeInvoice = newInv;
    this.populateForm(newInv);
    this.updatePreview();
    Storage.clearDraft();
    this.switchView('create');
    Validation.showToast(`Started new invoice: ${nextNum}`, 'info');
  },

  loadSampleData() {
    const sample = State.getSampleInvoice();
    State.activeInvoice = sample;
    this.populateForm(sample);
    this.updatePreview();
    this.switchView('create');
    Validation.showToast('Sample invoice loaded!', 'success');
  },

  saveCurrentInvoice() {
    this.syncFromForm();
    const inv = State.activeInvoice;

    // Validate
    const validation = Validation.validateInvoice(inv);
    if (!validation.isValid) {
      Validation.showToast(validation.errors[0], 'error');
      return;
    }

    // Save
    const saved = Storage.saveInvoice(inv);
    this.renderHistory();
    this.renderDashboard();
    Validation.showToast(`Invoice ${saved.invoiceNumber} saved successfully!`, 'success');
  },

  downloadInvoicePDF() {
    this.syncFromForm();
    const inv = State.activeInvoice;

    const validation = Validation.validateInvoice(inv);
    if (!validation.isValid) {
      Validation.showToast(validation.errors[0], 'error');
      return;
    }

    const totals = Calculations.calculateInvoiceTotals(inv);
    PDFEngine.downloadPDF(inv, totals);
  },

  printInvoice() {
    this.syncFromForm();
    PDFEngine.printInvoice();
  },

  // ==========================================
  // DASHBOARD VIEW RENDERING
  // ==========================================

  renderDashboard() {
    const invoices = Storage.getAllInvoices();
    const settings = Storage.getSettings();
    const defaultCurr = settings.defaultCurrency || 'INR';

    // Compute Metrics
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let unpaidCount = 0;

    invoices.forEach(inv => {
      const totals = Calculations.calculateInvoiceTotals(inv);
      totalInvoiced += totals.grandTotal;
      if (inv.paymentStatus === 'paid') {
        totalPaid += totals.grandTotal;
      } else {
        totalUnpaid += totals.grandTotal;
        unpaidCount++;
      }
    });

    // Metric Elements
    document.getElementById('metric-total-invoiced').textContent = Calculations.formatCurrency(totalInvoiced, defaultCurr);
    document.getElementById('metric-total-paid').textContent = Calculations.formatCurrency(totalPaid, defaultCurr);
    document.getElementById('metric-total-unpaid').textContent = Calculations.formatCurrency(totalUnpaid, defaultCurr);
    document.getElementById('metric-invoices-count').textContent = invoices.length;
    document.getElementById('metric-unpaid-badge').textContent = `${unpaidCount} Pending`;

    // Recent Invoices Table
    const recentContainer = document.getElementById('dashboard-recent-invoices');
    if (!recentContainer) return;

    const recentInvoices = invoices.slice(0, 5);

    if (recentInvoices.length === 0) {
      recentContainer.innerHTML = `
        <div class="py-12 text-center text-slate-400">
          <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-sm font-medium text-slate-600">No invoices created yet</p>
          <p class="text-xs text-slate-400 mt-1">Create your first invoice to view stats and manage your billing.</p>
          <button type="button" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition" onclick="App.createNewInvoice()">
            + Create New Invoice
          </button>
        </div>
      `;
      return;
    }

    recentContainer.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
              <th class="py-2.5 px-3">Invoice #</th>
              <th class="py-2.5 px-3">Customer</th>
              <th class="py-2.5 px-3">Date</th>
              <th class="py-2.5 px-3">Amount</th>
              <th class="py-2.5 px-3">Status</th>
              <th class="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${recentInvoices.map(inv => {
              const totals = Calculations.calculateInvoiceTotals(inv);
              return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-3 font-mono font-bold text-slate-900">${Templates.escape(inv.invoiceNumber)}</td>
                  <td class="py-3 px-3 font-medium text-slate-800">
                    <div>${Templates.escape(inv.customer?.name || 'Customer')}</div>
                    ${inv.customer?.company ? `<div class="text-[10px] text-slate-400">${Templates.escape(inv.customer.company)}</div>` : ''}
                  </td>
                  <td class="py-3 px-3 text-slate-500">${Templates.formatDate(inv.invoiceDate)}</td>
                  <td class="py-3 px-3 font-mono font-bold text-slate-900">${Calculations.formatCurrency(totals.grandTotal, inv.currency)}</td>
                  <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                      ${inv.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right space-x-2">
                    <button type="button" class="text-indigo-600 hover:text-indigo-900 font-semibold" onclick="App.editInvoice('${inv.id}')">Edit</button>
                    <button type="button" class="text-slate-500 hover:text-slate-800 font-semibold" onclick="App.downloadInvoiceById('${inv.id}')">PDF</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ==========================================
  // INVOICE HISTORY VIEW RENDERING
  // ==========================================

  renderHistory() {
    const container = document.getElementById('history-table-container');
    if (!container) return;

    let invoices = Storage.getAllInvoices();
    const filter = State.historyFilter;

    // Search filter
    if (filter.search) {
      invoices = invoices.filter(inv => {
        const num = (inv.invoiceNumber || '').toLowerCase();
        const custName = (inv.customer?.name || '').toLowerCase();
        const custComp = (inv.customer?.company || '').toLowerCase();
        return num.includes(filter.search) || custName.includes(filter.search) || custComp.includes(filter.search);
      });
    }

    // Status filter
    if (filter.status !== 'all') {
      invoices = invoices.filter(inv => inv.paymentStatus === filter.status);
    }

    // Sorting
    invoices.sort((a, b) => {
      if (filter.sortBy === 'date-asc') {
        return new Date(a.invoiceDate || 0) - new Date(b.invoiceDate || 0);
      } else if (filter.sortBy === 'amount-desc') {
        const totalA = Calculations.calculateInvoiceTotals(a).grandTotal;
        const totalB = Calculations.calculateInvoiceTotals(b).grandTotal;
        return totalB - totalA;
      } else {
        // date-desc default
        return new Date(b.invoiceDate || 0) - new Date(a.invoiceDate || 0);
      }
    });

    if (invoices.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-400">
          <svg class="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <h3 class="text-base font-bold text-slate-700">No invoices found</h3>
          <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try adjusting your search criteria or create a new invoice to get started.</p>
          <button type="button" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition" onclick="App.createNewInvoice()">
            + Create New Invoice
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <th class="py-3 px-4">Invoice #</th>
              <th class="py-3 px-4">Customer Details</th>
              <th class="py-3 px-4">Date & Due</th>
              <th class="py-3 px-4">Amount</th>
              <th class="py-3 px-4">Payment Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            ${invoices.map(inv => {
              const totals = Calculations.calculateInvoiceTotals(inv);
              return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <span class="text-indigo-600 cursor-pointer hover:underline" onclick="App.editInvoice('${inv.id}')">${Templates.escape(inv.invoiceNumber)}</span>
                    <div class="text-[10px] text-slate-400 font-sans capitalize">${inv.template || 'minimal'}</div>
                  </td>

                  <td class="py-3.5 px-4">
                    <div class="font-bold text-slate-800">${Templates.escape(inv.customer?.name || 'Customer Name')}</div>
                    ${inv.customer?.company ? `<div class="text-[11px] text-slate-500">${Templates.escape(inv.customer.company)}</div>` : ''}
                    ${inv.customer?.email ? `<div class="text-[10px] text-slate-400">${Templates.escape(inv.customer.email)}</div>` : ''}
                  </td>

                  <td class="py-3.5 px-4 text-slate-600">
                    <div>Issued: ${Templates.formatDate(inv.invoiceDate)}</div>
                    <div class="text-[11px] text-slate-400">Due: ${Templates.formatDate(inv.dueDate)}</div>
                  </td>

                  <td class="py-3.5 px-4">
                    <div class="font-mono font-bold text-sm text-slate-900">${Calculations.formatCurrency(totals.grandTotal, inv.currency)}</div>
                    <div class="text-[10px] text-slate-400">${inv.items?.length || 0} items</div>
                  </td>

                  <td class="py-3.5 px-4">
                    <button type="button" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition ${inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}" onclick="App.toggleStatus('${inv.id}')" title="Click to toggle status">
                      <span class="w-1.5 h-1.5 rounded-full ${inv.paymentStatus === 'paid' ? 'bg-emerald-600' : 'bg-amber-600'}"></span>
                      ${inv.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </button>
                  </td>

                  <td class="py-3.5 px-4 text-right space-x-1.5">
                    <button type="button" class="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded font-semibold transition" title="Edit Invoice" onclick="App.editInvoice('${inv.id}')">
                      Edit
                    </button>
                    <button type="button" class="px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-semibold transition" title="Duplicate Invoice" onclick="App.duplicateInvoice('${inv.id}')">
                      Duplicate
                    </button>
                    <button type="button" class="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded font-semibold transition" title="Download PDF" onclick="App.downloadInvoiceById('${inv.id}')">
                      PDF
                    </button>
                    <button type="button" class="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold transition" title="Delete Invoice" onclick="App.deleteInvoice('${inv.id}')">
                      Delete
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  editInvoice(id) {
    const inv = Storage.getInvoiceById(id);
    if (!inv) {
      Validation.showToast('Invoice not found', 'error');
      return;
    }
    State.activeInvoice = JSON.parse(JSON.stringify(inv));
    this.populateForm(State.activeInvoice);
    this.updatePreview();
    this.switchView('create');
    Validation.showToast(`Loaded ${inv.invoiceNumber} in editor`, 'info');
  },

  duplicateInvoice(id) {
    const dup = Storage.duplicateInvoice(id);
    if (dup) {
      this.renderHistory();
      this.renderDashboard();
      Validation.showToast(`Invoice duplicated as ${dup.invoiceNumber}`, 'success');
      this.editInvoice(dup.id);
    }
  },

  toggleStatus(id) {
    const inv = Storage.getInvoiceById(id);
    if (inv) {
      const newStatus = inv.paymentStatus === 'paid' ? 'unpaid' : 'paid';
      Storage.updateInvoiceStatus(id, newStatus);
      if (State.activeInvoice?.id === id) {
        State.activeInvoice.paymentStatus = newStatus;
        document.getElementById('invoice-status').value = newStatus;
        this.updatePreview();
      }
      this.renderHistory();
      this.renderDashboard();
      Validation.showToast(`Status updated to ${newStatus.toUpperCase()}`, 'info', 1500);
    }
  },

  deleteInvoice(id) {
    const inv = Storage.getInvoiceById(id);
    if (!inv) return;

    if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) {
      Storage.deleteInvoice(id);
      this.renderHistory();
      this.renderDashboard();
      Validation.showToast(`Deleted ${inv.invoiceNumber}`, 'warning');
    }
  },

  downloadInvoiceById(id) {
    const inv = Storage.getInvoiceById(id);
    if (inv) {
      const totals = Calculations.calculateInvoiceTotals(inv);
      // Temporarily render to preview canvas and download
      const canvas = document.getElementById('invoice-preview-canvas');
      const originalHTML = canvas.innerHTML;
      canvas.innerHTML = Templates.render(inv, totals);
      PDFEngine.downloadPDF(inv, totals).then(() => {
        // Restore active invoice preview
        this.updatePreview();
      });
    }
  },

  // ==========================================
  // SETTINGS VIEW MANAGEMENT
  // ==========================================

  populateSettings() {
    const settings = Storage.getSettings();
    const profile = Storage.getBusinessProfile() || {};
    const prefix = Storage.getPrefix();
    const seq = Storage.getSequence();

    // Default Profile
    document.getElementById('setting-business-name').value = profile.name || '';
    document.getElementById('setting-business-address').value = profile.address || '';
    document.getElementById('setting-business-phone').value = profile.phone || '';
    document.getElementById('setting-business-email').value = profile.email || '';
    document.getElementById('setting-business-gstin').value = profile.gstin || '';
    document.getElementById('setting-business-website').value = profile.website || '';

    // Preferences
    document.getElementById('setting-currency').value = settings.defaultCurrency || 'INR';
    document.getElementById('setting-tax-rate').value = settings.defaultTaxRate ?? 18;
    document.getElementById('setting-tax-type').value = settings.defaultTaxType || 'cgst_sgst';
    document.getElementById('setting-template').value = settings.defaultTemplate || 'minimal';
    document.getElementById('setting-inv-prefix').value = prefix;
    document.getElementById('setting-inv-seq').value = seq;
  },

  saveSettingsFromForm() {
    // 1. Business profile
    const profile = {
      name: document.getElementById('setting-business-name').value.trim(),
      address: document.getElementById('setting-business-address').value.trim(),
      phone: document.getElementById('setting-business-phone').value.trim(),
      email: document.getElementById('setting-business-email').value.trim(),
      gstin: document.getElementById('setting-business-gstin').value.trim().toUpperCase(),
      website: document.getElementById('setting-business-website').value.trim(),
      logo: State.activeInvoice?.business?.logo || Storage.getBusinessProfile()?.logo || ''
    };
    Storage.saveBusinessProfile(profile);

    // 2. Sequence & Prefix
    const prefix = document.getElementById('setting-inv-prefix').value.trim() || 'INV-';
    const seq = parseInt(document.getElementById('setting-inv-seq').value, 10) || 1;
    Storage.setPrefix(prefix);
    Storage.setSequence(seq);

    // 3. General Settings
    const settings = {
      defaultCurrency: document.getElementById('setting-currency').value,
      defaultTaxRate: parseFloat(document.getElementById('setting-tax-rate').value) || 0,
      defaultTaxType: document.getElementById('setting-tax-type').value,
      defaultTemplate: document.getElementById('setting-template').value,
      autoIncrementNumber: true
    };
    Storage.saveSettings(settings);

    Validation.showToast('Settings saved successfully!', 'success');
  },

  loadSettings() {
    const settings = Storage.getSettings();
    return settings;
  },

  exportBackup() {
    const jsonStr = Storage.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InvoiceForge_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Validation.showToast('Backup JSON exported successfully!', 'success');
  },

  importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = Storage.importBackupJSON(e.target.result);
      if (result.success) {
        Validation.showToast(`Imported ${result.count} invoices successfully!`, 'success');
        this.renderHistory();
        this.renderDashboard();
        this.populateSettings();
      } else {
        Validation.showToast(`Import failed: ${result.error}`, 'error');
      }
    };
    reader.readAsText(file);
  },

  confirmClearAll() {
    if (confirm('Are you sure you want to reset all data? This will delete all saved invoices, business profile, and sequences. This cannot be undone.')) {
      Storage.clearAllData();
      State.activeInvoice = State.createBlankInvoice('INV-0001');
      this.populateForm(State.activeInvoice);
      this.updatePreview();
      this.renderHistory();
      this.renderDashboard();
      this.populateSettings();
      Validation.showToast('All data has been reset to defaults', 'warning');
    }
  }
};

// Bootstrap application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
