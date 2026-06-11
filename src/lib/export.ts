import type { MonthSummary, CategoryTrend, BudgetPerformance, MerchantSummary } from '@/features/analytics/types';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from './formatters';

// ── CSV helpers ──────────────────────────────────────────────

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ];
  return lines.join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSV exports ──────────────────────────────────────────────

export function exportMonthlySummaryCSV(data: MonthSummary[], currency = 'USD') {
  const headers = ['Month', 'Income', 'Expenses', 'Savings', 'Savings Rate', 'Net Cash Flow', 'Transactions'];
  const rows = data.map(m => [
    m.label,
    m.income.toFixed(2),
    m.expenses.toFixed(2),
    m.savings.toFixed(2),
    `${(m.savingsRate * 100).toFixed(1)}%`,
    m.netCashFlow.toFixed(2),
    m.transactionCount,
  ]);
  downloadFile(toCSV(headers, rows), `monthly-summary-${Date.now()}.csv`, 'text/csv');
}

export function exportCategoryTrendsCSV(data: CategoryTrend[], currency = 'USD') {
  // Flatten: one row per category per month
  const allMonths = data[0]?.months.map(m => m.label) ?? [];
  const headers   = ['Category', 'Total', 'Avg Monthly', 'Change %', ...allMonths];
  const rows = data.map(t => [
    t.category,
    t.total.toFixed(2),
    t.avgMonthly.toFixed(2),
    `${(t.change * 100).toFixed(1)}%`,
    ...t.months.map(m => m.amount.toFixed(2)),
  ]);
  downloadFile(toCSV(headers, rows), `category-trends-${Date.now()}.csv`, 'text/csv');
}

export function exportBudgetPerformanceCSV(data: BudgetPerformance[]) {
  const headers = ['Category', 'Month', 'Budget Limit', 'Amount Spent', 'Usage %'];
  const rows: (string | number)[][] = [];
  data.forEach(bp => {
    bp.months.forEach(m => {
      rows.push([
        bp.category,
        m.label,
        m.limitAmount.toFixed(2),
        m.spentAmount.toFixed(2),
        `${(m.usageRatio * 100).toFixed(1)}%`,
      ]);
    });
  });
  downloadFile(toCSV(headers, rows), `budget-performance-${Date.now()}.csv`, 'text/csv');
}

export function exportTopMerchantsCSV(data: MerchantSummary[]) {
  const headers = ['Merchant', 'Category', 'Total Spent', 'Transactions', 'Avg Amount'];
  const rows = data.map(m => [
    m.merchant,
    m.category,
    m.total.toFixed(2),
    m.count,
    m.avgAmount.toFixed(2),
  ]);
  downloadFile(toCSV(headers, rows), `top-merchants-${Date.now()}.csv`, 'text/csv');
}

export function exportTransactionsCSV(transactions: Transaction[]) {
  const headers = ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Account', 'Note'];
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.category,
    t.merchant ?? '',
    t.amount.toFixed(2),
    t.accountName ?? '',
    t.note ?? '',
  ]);
  downloadFile(toCSV(headers, rows), `transactions-${Date.now()}.csv`, 'text/csv');
}

// ── PDF exports ──────────────────────────────────────────────

async function getJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  return { jsPDF, autoTable };
}

const PDF_COLORS = {
  primary:   [37, 99, 235]  as [number, number, number],
  success:   [34, 197, 94]  as [number, number, number],
  danger:    [239, 68, 68]  as [number, number, number],
  warning:   [245, 158, 11] as [number, number, number],
  text:      [15, 23, 42]   as [number, number, number],
  muted:     [100, 116, 139] as [number, number, number],
  border:    [226, 232, 240] as [number, number, number],
  header:    [248, 250, 252] as [number, number, number],
};

function addPDFHeader(doc: InstanceType<typeof import('jspdf').default>, title: string, subtitle: string) {
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FinanceOS', 14, 10);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 17);
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(subtitle, 14, 27);
  doc.setTextColor(...PDF_COLORS.text);
}

export async function exportMonthlySummaryPDF(data: MonthSummary[], currency = 'USD') {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const subtitle = `Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} · ${data.length}-month report`;
  addPDFHeader(doc, 'Monthly Summary Report', subtitle);

  // Summary stats row
  const totals = data.reduce((acc, m) => ({
    income:   acc.income   + m.income,
    expenses: acc.expenses + m.expenses,
    savings:  acc.savings  + m.savings,
  }), { income: 0, expenses: 0, savings: 0 });

  const avgSavingsRate = data.reduce((s, m) => s + m.savingsRate, 0) / data.length;

  const stats = [
    { label: 'Total Income',    value: formatCurrency(totals.income, currency),   color: PDF_COLORS.success },
    { label: 'Total Expenses',  value: formatCurrency(totals.expenses, currency), color: PDF_COLORS.danger },
    { label: 'Total Savings',   value: formatCurrency(totals.savings, currency),  color: PDF_COLORS.primary },
    { label: 'Avg Savings Rate',value: `${(avgSavingsRate * 100).toFixed(1)}%`,   color: PDF_COLORS.warning },
  ];

  let y = 34;
  const boxW = 43;
  stats.forEach((s, i) => {
    const x = 14 + i * (boxW + 3);
    doc.setFillColor(...PDF_COLORS.header);
    doc.roundedRect(x, y, boxW, 16, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(s.label, x + 3, y + 6);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...s.color);
    doc.text(s.value, x + 3, y + 13);
    doc.setFont('helvetica', 'normal');
  });

  y += 22;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.text);
  doc.text('Month-by-Month Breakdown', 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['Month', 'Income', 'Expenses', 'Savings', 'Savings Rate', 'Net Cash Flow', 'Txns']],
    body: data.map(m => [
      m.label,
      formatCurrency(m.income, currency),
      formatCurrency(m.expenses, currency),
      formatCurrency(m.savings, currency),
      `${(m.savingsRate * 100).toFixed(1)}%`,
      formatCurrency(m.netCashFlow, currency),
      m.transactionCount,
    ]),
    styles:     { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PDF_COLORS.primary, textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PDF_COLORS.header },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  });

  doc.save(`monthly-summary-${Date.now()}.pdf`);
}

export async function exportCategoryTrendsPDF(data: CategoryTrend[], type: 'expense' | 'income' = 'expense', currency = 'USD') {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const subtitle = `Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} · ${type === 'expense' ? 'Expense' : 'Income'} categories`;
  addPDFHeader(doc, 'Category Analysis Report', subtitle);

  const allMonths = data[0]?.months ?? [];

  autoTable(doc, {
    startY: 34,
    head: [[
      'Category', 'Total', 'Avg/Month', 'Trend',
      ...allMonths.map(m => m.label.split(' ')[0]), // short month names
    ]],
    body: data.map(t => [
      t.category,
      formatCurrency(t.total, currency),
      formatCurrency(t.avgMonthly, currency),
      `${t.change >= 0 ? '+' : ''}${(t.change * 100).toFixed(1)}%`,
      ...t.months.map(m => formatCurrency(m.amount, currency)),
    ]),
    styles:     { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: PDF_COLORS.primary, textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PDF_COLORS.header },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: {
        halign: 'right',
        // will be styled by didParseCell
      },
    },
    didParseCell: (hookData) => {
      if (hookData.column.index === 3 && hookData.section === 'body') {
        const val = String(hookData.cell.text);
        if (val.startsWith('+')) hookData.cell.styles.textColor = PDF_COLORS.danger;
        else if (val.startsWith('-')) hookData.cell.styles.textColor = PDF_COLORS.success;
      }
    },
  });

  doc.save(`category-analysis-${Date.now()}.pdf`);
}

export async function exportBudgetPerformancePDF(data: BudgetPerformance[], currency = 'USD') {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const subtitle = `Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`;
  addPDFHeader(doc, 'Budget Performance Report', subtitle);

  const rows: (string | number)[][] = [];
  data.forEach(bp => {
    bp.months.forEach((m, idx) => {
      rows.push([
        idx === 0 ? bp.category : '',
        m.label,
        formatCurrency(m.limitAmount, currency),
        formatCurrency(m.spentAmount, currency),
        `${(m.usageRatio * 100).toFixed(1)}%`,
        m.usageRatio > 1 ? 'Over Budget' : m.usageRatio > 0.9 ? 'Near Limit' : 'On Track',
      ]);
    });
  });

  autoTable(doc, {
    startY: 34,
    head: [['Category', 'Month', 'Budget', 'Spent', 'Usage', 'Status']],
    body: rows,
    styles:     { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PDF_COLORS.primary, textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PDF_COLORS.header },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    didParseCell: (hookData) => {
      if (hookData.column.index === 5 && hookData.section === 'body') {
        const val = String(hookData.cell.text[0] ?? '');
        if (val === 'Over Budget')  hookData.cell.styles.textColor = PDF_COLORS.danger;
        else if (val === 'Near Limit') hookData.cell.styles.textColor = PDF_COLORS.warning;
        else if (val === 'On Track')   hookData.cell.styles.textColor = PDF_COLORS.success;
      }
    },
  });

  doc.save(`budget-performance-${Date.now()}.pdf`);
}

export async function exportTopMerchantsPDF(data: MerchantSummary[], currency = 'USD') {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const subtitle = `Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`;
  addPDFHeader(doc, 'Top Merchants Report', subtitle);

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Merchant', 'Category', 'Total Spent', 'Transactions', 'Avg Amount']],
    body: data.map((m, i) => [
      i + 1,
      m.merchant,
      m.category,
      formatCurrency(m.total, currency),
      m.count,
      formatCurrency(m.avgAmount, currency),
    ]),
    styles:     { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PDF_COLORS.primary, textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PDF_COLORS.header },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  doc.save(`top-merchants-${Date.now()}.pdf`);
}

export async function exportTransactionsPDF(transactions: Transaction[], title = 'Transactions Report', currency = 'USD') {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const subtitle = `Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} · ${transactions.length} transactions`;
  addPDFHeader(doc, title, subtitle);

  autoTable(doc, {
    startY: 34,
    head: [['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Account', 'Note']],
    body: transactions.map(t => [
      formatDate(t.date),
      t.type,
      t.category,
      t.merchant ?? '—',
      formatCurrency(t.amount, currency),
      t.accountName ?? '—',
      t.note ?? '—',
    ]),
    styles:     { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: PDF_COLORS.primary, textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PDF_COLORS.header },
    columnStyles: { 4: { halign: 'right' } },
    didParseCell: (hookData) => {
      if (hookData.column.index === 1 && hookData.section === 'body') {
        const val = String(hookData.cell.text[0] ?? '');
        if (val === 'income')  hookData.cell.styles.textColor = PDF_COLORS.success;
        if (val === 'expense') hookData.cell.styles.textColor = PDF_COLORS.danger;
      }
    },
  });

  doc.save(`transactions-${Date.now()}.pdf`);
}
