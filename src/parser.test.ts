import { expect, test } from 'bun:test';
import { parseInvoiceJson } from './parser.ts';

test('parses basic invoice', () => {
  const json = JSON.stringify({
    invoiceNumber: 'INV-1001',
    date: '2026-05-01',
    billTo: { name: 'Acme', address: '123 St' },
    items: [{ description: 'Dev', quantity: 10, unitPrice: 150, total: 1500 }],
    totalAmount: 1500
  });
  const invoice = parseInvoiceJson(json);
  expect(invoice.invoiceNumber).toBe('INV-1001');
  expect(invoice.items.length).toBe(1);
  expect(invoice.totalAmount).toBe(1500);
});

test('parses invoice with optional fields', () => {
  const json = JSON.stringify({
    invoiceNumber: 'INV-1002',
    date: '2026-05-01',
    dueDate: '2026-05-15',
    billTo: { name: 'Acme', address: '123 St' },
    items: [{ description: 'Dev', quantity: 1, unitPrice: 100, total: 100 }],
    totalAmount: 100,
    notes: 'Thank you!'
  });
  const invoice = parseInvoiceJson(json);
  expect(invoice.dueDate).toBe('2026-05-15');
  expect(invoice.notes).toBe('Thank you!');
});

test('throws on empty stdin', () => {
  expect(() => parseInvoiceJson('')).toThrow('stdin is empty; pipe a JSON invoice object.');
  expect(() => parseInvoiceJson('   \n  ')).toThrow('stdin is empty; pipe a JSON invoice object.');
});

test('throws on invalid JSON', () => {
  expect(() => parseInvoiceJson('{ invalid }')).toThrow('stdin is not valid JSON.');
});

test('throws on non-object root', () => {
  expect(() => parseInvoiceJson('[]')).toThrow('JSON root must be a single invoice object (not an array).');
  expect(() => parseInvoiceJson('"string"')).toThrow('JSON root must be a single invoice object (not an array).');
});

test('throws on missing required fields', () => {
  const base = {
    invoiceNumber: 'INV-1',
    date: '2026-05-01',
    billTo: { name: 'A', address: 'B' },
    items: [{ description: 'D', quantity: 1, unitPrice: 1, total: 1 }],
    totalAmount: 1
  };

  const noInvoiceNum = { ...base };
  // @ts-ignore
  delete noInvoiceNum.invoiceNumber;
  expect(() => parseInvoiceJson(JSON.stringify(noInvoiceNum))).toThrow('invoice: missing or invalid string field "invoiceNumber".');

  const noDate = { ...base };
  // @ts-ignore
  delete noDate.date;
  expect(() => parseInvoiceJson(JSON.stringify(noDate))).toThrow('invoice: missing or invalid string field "date".');
});

test('throws on invalid items', () => {
  const base = {
    invoiceNumber: 'INV-1',
    date: '2026-05-01',
    billTo: { name: 'A', address: 'B' },
    totalAmount: 1
  };

  expect(() => parseInvoiceJson(JSON.stringify({ ...base, items: [] }))).toThrow('invoice.items must be a non-empty array.');
  expect(() => parseInvoiceJson(JSON.stringify({ ...base, items: "not array" }))).toThrow('invoice.items must be a non-empty array.');
  
  expect(() => parseInvoiceJson(JSON.stringify({ 
    ...base, 
    items: [{ description: 'D', quantity: "1", unitPrice: 1, total: 1 }] 
  }))).toThrow('items[0]: missing or invalid number field "quantity".');
});

test('throws on invalid billTo', () => {
  const base = {
    invoiceNumber: 'INV-1',
    date: '2026-05-01',
    items: [{ description: 'D', quantity: 1, unitPrice: 1, total: 1 }],
    totalAmount: 1
  };

  expect(() => parseInvoiceJson(JSON.stringify({ ...base, billTo: "string" }))).toThrow('invoice: "billTo" must be an object with "name" and "address".');
  expect(() => parseInvoiceJson(JSON.stringify({ ...base, billTo: { name: 'A' } }))).toThrow('invoice.billTo: missing or invalid string field "address".');
});
