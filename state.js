/**
 * InvoiceForge State Management
 * Holds active invoice model, application views, options, and reactive state.
 */

const State = {
  // Available views
  currentView: 'create', // 'dashboard', 'create', 'history', 'settings'

  // Available currencies
  currencies: [
    { code: 'INR', label: '₹ INR (Indian Rupee)', symbol: '₹' },
    { code: 'USD', label: '$ USD (US Dollar)', symbol: '$' },
    { code: 'EUR', label: '€ EUR (Euro)', symbol: '€' },
    { code: 'GBP', label: '£ GBP (British Pound)', symbol: '£' },
    { code: 'AUD', label: 'A$ AUD (Australian Dollar)', symbol: 'A$' },
    { code: 'CAD', label: 'C$ CAD (Canadian Dollar)', symbol: 'C$' },
    { code: 'AED', label: 'AED (UAE Dirham)', symbol: 'AED ' },
    { code: 'SGD', label: 'S$ SGD (Singapore Dollar)', symbol: 'S$' },
    { code: 'JPY', label: '¥ JPY (Japanese Yen)', symbol: '¥' }
  ],

  // Available GST tax slabs
  taxSlabs: [
    { value: 0, label: '0% (No Tax)' },
    { value: 5, label: '5% GST' },
    { value: 12, label: '12% GST' },
    { value: 18, label: '18% GST (Standard)' },
    { value: 28, label: '28% GST' },
    { value: 'custom', label: 'Custom %' }
  ],

  // Available templates
  templates: [
    { id: 'minimal', name: 'Minimal', description: 'Clean monochrome modern Swiss style' },
    { id: 'business', name: 'Business', description: 'Corporate navy structure with tabular borders' },
    { id: 'modern', name: 'Modern', description: 'Contemporary layout with colorful accents & badges' }
  ],

  /**
   * Generates a blank invoice template
   */
  createBlankInvoice(nextInvoiceNumber = 'INV-0001') {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 15);

    return {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      invoiceNumber: nextInvoiceNumber,
      invoiceDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      currency: 'INR',
      paymentStatus: 'unpaid', // 'unpaid' or 'paid'
      template: 'minimal', // 'minimal', 'business', 'modern'

      // Business Info
      business: {
        name: '',
        logo: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        website: ''
      },

      // Customer Info
      customer: {
        name: '',
        company: '',
        address: '',
        phone: '',
        email: '',
        gstin: ''
      },

      // Items
      items: [
        {
          id: 'item_' + Date.now() + '_1',
          name: '',
          description: '',
          quantity: 1,
          unitPrice: 0
        }
      ],

      // Discount & Tax Settings
      discountType: 'percent', // 'percent' or 'fixed'
      discountValue: 0,
      taxRate: 18,
      taxType: 'cgst_sgst', // 'none', 'cgst_sgst', 'igst', 'flat'

      // Payment Details & Notes
      notes: 'Thank you for your business! Payment is expected within the due date.',
      paymentInstructions: 'Bank Name: HDFC Bank\nA/C No: 50200012345678\nIFSC: HDFC0001234\nUPI ID: business@upi',
      terms: '1. Late fee of 1.5% per month applies on overdue invoices.\n2. Goods/services once provided cannot be returned.'
    };
  },

  /**
   * Sample invoice data for quick demonstration
   */
  getSampleInvoice() {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 15);

    return {
      id: 'inv_sample_001',
      invoiceNumber: 'INV-0001',
      invoiceDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      currency: 'INR',
      paymentStatus: 'unpaid',
      template: 'modern',

      business: {
        name: 'Apex Design & Tech Studio',
        logo: '',
        address: '804, Tech Park, Outer Ring Road, Bellandur, Bengaluru, Karnataka - 560103',
        phone: '+91 98765 43210',
        email: 'billing@apexstudio.design',
        gstin: '29AAAAA0000A1Z5',
        website: 'https://apexstudio.design'
      },

      customer: {
        name: 'Rahul Sharma',
        company: 'Starlight Enterprises Pvt Ltd',
        address: '42, Cyber Hub, Phase 2, Gurugram, Haryana - 122002',
        phone: '+91 91234 56789',
        email: 'finance@starlight.co',
        gstin: '06BBBBB1111B2Z8'
      },

      items: [
        {
          id: 'item_sample_1',
          name: 'Web & Mobile App UI/UX Design',
          description: 'Design system, Figma high-fidelity prototypes, 25 responsive screens',
          quantity: 1,
          unitPrice: 45000
        },
        {
          id: 'item_sample_2',
          name: 'Frontend Development (React + Tailwind)',
          description: 'Responsive implementation, performance optimization, a11y compliance',
          quantity: 40,
          unitPrice: 1200
        },
        {
          id: 'item_sample_3',
          name: 'Cloud Deployment & CI/CD Setup',
          description: 'GCP infrastructure, automated staging/production build pipelines',
          quantity: 1,
          unitPrice: 15000
        }
      ],

      discountType: 'percent',
      discountValue: 5,
      taxRate: 18,
      taxType: 'igst', // Inter-state Karnataka to Haryana

      notes: 'Thank you for your business! We appreciate the opportunity to collaborate.',
      paymentInstructions: 'Account Name: Apex Design Studio\nBank: HDFC Bank Ltd\nA/C No: 50200098765432\nIFSC: HDFC0000240\nUPI: apexstudio@okhdfcbank',
      terms: '1. Please make payments by the due date.\n2. Include the invoice number in the payment reference.'
    };
  },

  // Active working invoice
  activeInvoice: null,

  // History search/filter state
  historyFilter: {
    search: '',
    status: 'all', // 'all', 'paid', 'unpaid'
    sortBy: 'date-desc' // 'date-desc', 'date-asc', 'amount-desc'
  },

  // Subscribers for reactive updates
  listeners: [],

  subscribe(fn) {
    this.listeners.push(fn);
  },

  notify() {
    this.listeners.forEach(fn => fn(this.activeInvoice));
  }
};

window.State = State;
