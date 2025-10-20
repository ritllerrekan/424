import { WasteMetric } from '../types/waste';

export function exportToCSV(
  data: any[],
  filename: string,
  headers: { key: string; label: string }[]
): void {
  const csvHeaders = headers.map(h => h.label).join(',');
  const csvRows = data.map(row =>
    headers.map(h => {
      const value = row[h.key];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    }).join(',')
  );

  const csvContent = [csvHeaders, ...csvRows].join('\n');
  downloadFile(csvContent, filename, 'text/csv');
}

export function exportWasteMetricsToCSV(metrics: WasteMetric[], filename: string = 'waste-metrics.csv'): void {
  const headers = [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'phase', label: 'Phase' },
    { key: 'waste_category', label: 'Category' },
    { key: 'waste_quantity', label: 'Quantity' },
    { key: 'waste_unit', label: 'Unit' },
    { key: 'waste_reason', label: 'Reason' },
    { key: 'cost_impact', label: 'Cost Impact' },
    { key: 'currency', label: 'Currency' },
    { key: 'recorded_at', label: 'Recorded At' }
  ];

  exportToCSV(metrics, filename, headers);
}

export function exportChartDataToCSV(
  chartData: any[],
  filename: string,
  headers: { key: string; label: string }[]
): void {
  exportToCSV(chartData, filename, headers);
}

export function generatePDFContent(
  metrics: WasteMetric[],
  summary: any,
  chartData: {
    wasteTrends: any[];
    wasteByCategory: any[];
    wasteByPhase: any[];
  }
): string {
  const totalWaste = metrics.reduce((sum, m) => sum + parseFloat(m.waste_quantity.toString()), 0);
  const totalCost = metrics.reduce((sum, m) => sum + parseFloat(m.cost_impact.toString()), 0);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Waste Metrics Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #10b981;
      border-bottom: 3px solid #10b981;
      padding-bottom: 10px;
    }
    h2 {
      color: #059669;
      margin-top: 30px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #10b981;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #059669;
      font-size: 14px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #10b981;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background: #f9fafb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Waste Metrics Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>

  <h2>Summary</h2>
  <div class="summary">
    <div class="summary-card">
      <h3>Total Waste</h3>
      <div class="value">${totalWaste.toFixed(2)} kg</div>
    </div>
    <div class="summary-card">
      <h3>Total Cost Impact</h3>
      <div class="value">$${totalCost.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <h3>Total Incidents</h3>
      <div class="value">${metrics.length}</div>
    </div>
    <div class="summary-card">
      <h3>Average Per Incident</h3>
      <div class="value">${(totalWaste / (metrics.length || 1)).toFixed(2)} kg</div>
    </div>
  </div>

  <h2>Waste by Category</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Quantity (kg)</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${chartData.wasteByCategory.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.value.toFixed(2)}</td>
          <td>${((item.value / totalWaste) * 100).toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Waste by Phase</h2>
  <table>
    <thead>
      <tr>
        <th>Phase</th>
        <th>Waste (kg)</th>
        <th>Cost ($)</th>
      </tr>
    </thead>
    <tbody>
      ${chartData.wasteByPhase.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.waste.toFixed(2)}</td>
          <td>$${item.cost.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Recent Incidents</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Phase</th>
        <th>Category</th>
        <th>Quantity</th>
        <th>Cost</th>
        <th>Reason</th>
      </tr>
    </thead>
    <tbody>
      ${metrics.slice(0, 20).map(metric => `
        <tr>
          <td>${new Date(metric.recorded_at).toLocaleDateString()}</td>
          <td>${metric.phase}</td>
          <td>${metric.waste_category}</td>
          <td>${metric.waste_quantity} ${metric.waste_unit}</td>
          <td>$${parseFloat(metric.cost_impact.toString()).toFixed(2)}</td>
          <td>${metric.waste_reason}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Food Supply Chain - Waste Analytics Report</p>
  </div>
</body>
</html>
  `;

  return html;
}

export function exportToPDF(
  metrics: WasteMetric[],
  summary: any,
  chartData: any
): void {
  const htmlContent = generatePDFContent(metrics, summary, chartData);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        URL.revokeObjectURL(url);
      }, 250);
    };
  }
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
