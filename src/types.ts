/** Party and mailing address shown on the invoice. */
export type BillTo = {
  name: string;
  address: string;
};

/** Full payload used to render an invoice PDF. */
export type InvoiceData = {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  billTo: BillTo;
  items: InvoiceItem[];
  totalAmount: number;
  notes?: string;
};

/** Single line item with quantity and pricing. */
export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};
