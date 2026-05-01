import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import type { InvoiceData } from '../types.ts';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  meta: {
    textAlign: 'right',
    fontSize: 10,
    lineHeight: 1.5,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 12,
    fontSize: 11,
    color: '#374151',
  },
  block: {
    marginBottom: 8,
    lineHeight: 1.4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    paddingBottom: 6,
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    fontSize: 9,
  },
  colDesc: { width: '42%' },
  colQty: { width: '12%', textAlign: 'right' },
  colUnit: { width: '20%', textAlign: 'right' },
  colTotal: { width: '26%', textAlign: 'right' },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 16,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 12,
    minWidth: 80,
    textAlign: 'right',
  },
  notes: {
    marginTop: 28,
    padding: 12,
    backgroundColor: '#f3f4f6',
    fontSize: 9,
    lineHeight: 1.5,
  },
});

/** Formats a number as a USD currency string for the PDF. */
function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Modern layout: header, bill-to, line items table, total, and optional notes. */
export const TemplateModern: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>INVOICE</Text>
        <View style={styles.meta}>
          <Text>Invoice #{data.invoiceNumber}</Text>
          <Text>Date: {data.date}</Text>
          {data.dueDate ? <Text>Due: {data.dueDate}</Text> : null}
        </View>
      </View>

      <Text style={styles.label}>Bill to</Text>
      <View style={styles.block}>
        <Text>{data.billTo.name}</Text>
        <Text>{data.billTo.address}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.colDesc}>Description</Text>
        <Text style={styles.colQty}>Qty</Text>
        <Text style={styles.colUnit}>Unit price</Text>
        <Text style={styles.colTotal}>Line total</Text>
      </View>
      {data.items.map((item, i) => (
        <View key={i} style={styles.tableRow} wrap>
          <Text style={styles.colDesc}>{item.description}</Text>
          <Text style={styles.colQty}>{String(item.quantity)}</Text>
          <Text style={styles.colUnit}>{money(item.unitPrice)}</Text>
          <Text style={styles.colTotal}>{money(item.total)}</Text>
        </View>
      ))}

      <View style={styles.totalsRow}>
        <Text style={styles.totalLabel}>Total due</Text>
        <Text style={styles.totalValue}>{money(data.totalAmount)}</Text>
      </View>

      {data.notes ? (
        <View style={styles.notes}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Notes</Text>
          <Text>{data.notes}</Text>
        </View>
      ) : null}
    </Page>
  </Document>
);
