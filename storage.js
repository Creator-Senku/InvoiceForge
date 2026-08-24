/**
 * InvoiceForge Storage Layer
 * LocalStorage wrapper for draft auto-saving, invoice history, sequence counters, and backup.
 */

const Storage = {
  KEYS: {
    INVOICES: 'invoiceforge_invoices_v1',
    SEQUENCE: 'invoiceforge_sequence_v1',
    PREFIX: 'invoiceforge_prefix_v1',
    BUSINESS_PROFILE: 'invoiceforge_business_profile_v1',
    SETTINGS: 'invoiceforge_settings_v1',
    DRAFT: 'invoiceforge_current_draft_v1'
  },

  /**
   * Safe localStorage get helper with fallback
   */
  _getItem(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`[InvoiceForge Storage] Error reading ${key}:`, e);
      return fallback;
    }
  },

  /**
   * Safe localStorage set helper
   */
  _setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[InvoiceForge Storage] Error writing ${key}:`, e);
      return false;
    }
  },

  // ==========================================
  // INVOICE SEQUENCE MANAGEMENT
  // ==========================================

  getSequence() {
    const seq = this._getItem(this.KEYS.SEQUENCE, 1);
    return typeof seq === 'number' && seq >= 1 ? seq : 1;
  },

  getPrefix() {
    const prefix = this._getItem(this.KEYS.PREFIX, 'INV-');
    return prefix || 'INV-';
  },

  setSequence(num) {
    const valid = Math.max(1, parseInt(num, 10) || 1);
    this._setItem(this.KEYS.SEQUENCE, valid);
  },

  setPrefix(prefix) {
    this._setItem(this.KEYS.PREFIX, prefix || 'INV-');
  },

  getNextInvoiceNumber() {
    const prefix = this.getPrefix();
    const seq = this.getSequence();
    const padded = String(seq).padStart(4, '0');
    return `${prefix}${padded}`;
  },

  incrementSequence() {
    const current = this.getSequence();
    this.setSequence(current + 1);
  },

  // ==========================================
  // BUSINESS PROFILE DEFAULTS
  // ==========================================

  getBusinessProfile() {
    return this._getItem(this.KEYS.BUSINESS_PROFILE, null);
  },

  saveBusinessProfile(profile) {
    return this._setItem(this.KEYS.BUSINESS_PROFILE, profile);
  },

  // ==========================================
  // APP SETTINGS
  // ==========================================

  getSettings() {
    return this._getItem(this.KEYS.SETTINGS, {
      defaultCurrency: 'INR',
      defaultTaxRate: 18,
      defaultTaxType: 'cgst_sgst',
      defaultTemplate: 'minimal',
      defaultDueDays: 15,
      autoIncrementNumber: true
    });
  },

  saveSettings(settings) {
    return this._setItem(this.KEYS.SETTINGS, settings);
  },

  // ==========================================
  // INVOICE HISTORY CRUD
  // ==========================================

  getAllInvoices() {
    const invoices = this._getItem(this.KEYS.INVOICES, []);
    return Array.isArray(invoices) ? invoices : [];
  },

  getInvoiceById(id) {
    const invoices = this.getAllInvoices();
    return invoices.find(inv => inv.id === id) || null;
  },

  saveInvoice(invoice) {
    const invoices = this.getAllInvoices();
    const index = invoices.findIndex(inv => inv.id === invoice.id);
    
    // Stamp last updated timestamp
    const invoiceToSave = {
      ...invoice,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      invoices[index] = invoiceToSave;
    } else {
      invoiceToSave.createdAt = new Date().toISOString();
      invoices.unshift(invoiceToSave);
      
      // Auto-increment sequence if this was a new invoice matching sequence
      const settings = this.getSettings();
      if (settings.autoIncrementNumber !== false) {
        this.incrementSequence();
      }
    }

    this._setItem(this.KEYS.INVOICES, invoices);
    return invoiceToSave;
  },

  deleteInvoice(id) {
    const invoices = this.getAllInvoices().filter(inv => inv.id !== id);
    this._setItem(this.KEYS.INVOICES, invoices);
    return true;
  },

  updateInvoiceStatus(id, newStatus) {
    const invoices = this.getAllInvoices();
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice) {
      invoice.paymentStatus = newStatus;
      invoice.updatedAt = new Date().toISOString();
      this._setItem(this.KEYS.INVOICES, invoices);
      return true;
    }
    return false;
  },

  duplicateInvoice(id) {
    const original = this.getInvoiceById(id);
    if (!original) return null;

    const nextNumber = this.getNextInvoiceNumber();
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 15);

    const duplicate = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      invoiceNumber: nextNumber,
      invoiceDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveInvoice(duplicate);
    return duplicate;
  },

  // ==========================================
  // DRAFT AUTO-SAVE
  // ==========================================

  saveDraft(invoice) {
    return this._setItem(this.KEYS.DRAFT, invoice);
  },

  getDraft() {
    return this._getItem(this.KEYS.DRAFT, null);
  },

  clearDraft() {
    localStorage.removeItem(this.KEYS.DRAFT);
  },

  // ==========================================
  // BACKUP & RESTORE
  // ==========================================

  exportBackupJSON() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      invoices: this.getAllInvoices(),
      sequence: this.getSequence(),
      prefix: this.getPrefix(),
      businessProfile: this.getBusinessProfile(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  },

  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.invoices && Array.isArray(data.invoices)) {
        this._setItem(this.KEYS.INVOICES, data.invoices);
      }
      if (data.sequence) {
        this.setSequence(data.sequence);
      }
      if (data.prefix) {
        this.setPrefix(data.prefix);
      }
      if (data.businessProfile) {
        this.saveBusinessProfile(data.businessProfile);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return { success: true, count: (data.invoices || []).length };
    } catch (e) {
      console.error('[InvoiceForge Storage] Import error:', e);
      return { success: false, error: e.message };
    }
  },

  clearAllData() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
};

window.Storage = Storage;
