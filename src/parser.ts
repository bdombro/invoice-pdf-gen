import type { BillTo, InvoiceData, InvoiceItem } from './types.ts';

/**
 * Reads and parses `obj[key]` as a finite number or throws with `ctx` in the message.
 */
function requireNumber(obj: Record<string, unknown>, key: string, ctx: string): number {
  const v = obj[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`${ctx}: missing or invalid number field "${key}".`);
  }
  return v;
}

/**
 * Reads and parses `obj[key]` as a non-empty string or throws with `ctx` in the message.
 */
function requireString(obj: Record<string, unknown>, key: string, ctx: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.trim() === '') {
    throw new Error(`${ctx}: missing or invalid string field "${key}".`);
  }
  return v;
}

/**
 * Validates and returns a {@link BillTo} from unknown JSON under the given error context.
 */
function parseBillTo(raw: unknown, ctx: string): BillTo {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`${ctx}: "billTo" must be an object with "name" and "address".`);
  }
  const o = raw as Record<string, unknown>;
  return {
    name: requireString(o, 'name', `${ctx}.billTo`),
    address: requireString(o, 'address', `${ctx}.billTo`),
  };
}

/**
 * Parses one `items[]` element into an {@link InvoiceItem}.
 */
function parseItem(raw: unknown, index: number): InvoiceItem {
  const ctx = `items[${index}]`;
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`${ctx} must be an object.`);
  }
  const o = raw as Record<string, unknown>;
  return {
    description: requireString(o, 'description', ctx),
    quantity: requireNumber(o, 'quantity', ctx),
    unitPrice: requireNumber(o, 'unitPrice', ctx),
    total: requireNumber(o, 'total', ctx),
  };
}

/**
 * Parses a JSON string from stdin into validated {@link InvoiceData}.
 */
export function parseInvoiceJson(raw: string): InvoiceData {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('stdin is empty; pipe a JSON invoice object.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('stdin is not valid JSON.');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON root must be a single invoice object (not an array).');
  }
  const o = parsed as Record<string, unknown>;

  const invoiceNumber = requireString(o, 'invoiceNumber', 'invoice');
  const date = requireString(o, 'date', 'invoice');
  const billTo = parseBillTo(o.billTo, 'invoice');

  const itemsRaw = o.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw new Error('invoice.items must be a non-empty array.');
  }
  const items = itemsRaw.map((row, i) => parseItem(row, i));

  const totalAmount = requireNumber(o, 'totalAmount', 'invoice');

  let dueDate: string | undefined;
  if (o.dueDate !== undefined) {
    if (typeof o.dueDate !== 'string') {
      throw new Error('invoice.dueDate must be a string when provided.');
    }
    dueDate = o.dueDate;
  }

  let notes: string | undefined;
  if (o.notes !== undefined) {
    if (typeof o.notes !== 'string') {
      throw new Error('invoice.notes must be a string when provided.');
    }
    notes = o.notes;
  }

  return {
    invoiceNumber,
    date,
    dueDate,
    billTo,
    items,
    totalAmount,
    notes,
  };
}
