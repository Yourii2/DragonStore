/**
 * Export and Print Utilities for Dragon Store
 * Supports:
 * 1. Clean Native Window Printing (styled for bills/tables)
 * 2. PDF generation via Browser Print to PDF
 * 3. Excel (.xls / CSV) formatted download with Arabic UTF-8 BOM
 */

export function printTableOrReceipt(title: string, htmlContent: string) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }

  const printDocument = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${title} - متجر دراجون للاليكترونيات</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    body {
      font-family: 'Cairo', sans-serif;
      padding: 24px;
      margin: 0;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #06b6d4;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 900;
      color: #0e7490;
      margin: 0;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .contacts {
      font-size: 12px;
      font-weight: bold;
      text-align: left;
      color: #334155;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 800;
      margin: 16px 0 12px 0;
      color: #1e293b;
      text-align: center;
      background: #f1f5f9;
      padding: 8px;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 12px;
    }
    th {
      background-color: #0e7490;
      color: #ffffff;
      padding: 10px;
      text-align: right;
      border: 1px solid #cbd5e1;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      text-align: right;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 32px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      body { padding: 10px; }
      @page { margin: 1cm; size: auto; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="company-title">شركه دراجون للأنظمه الامنيه</h1>
      <div class="subtitle">متجر دراجون للاليكترونيات و الاعمال الحره • م . ممدوح المصرى</div>
    </div>
    <div class="contacts" dir="ltr">
      <div>Tel: 01150006289</div>
      <div>Tel: 01050016289</div>
      <div>Date: ${new Date().toLocaleDateString('ar-EG')}</div>
    </div>
  </div>

  <div class="doc-title">${title}</div>

  <div>${htmlContent}</div>

  <div class="footer">
    <span>نظام دراجون ERP لإدارة الأنشطة والعمليات</span>
    <span>تاريخ وتوقيت التصدير: ${new Date().toLocaleString('ar-EG')}</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(printDocument);
  printWindow.document.close();
}

/**
 * Trigger browser print dialog styled for saving directly as PDF
 */
export function exportToPDF(title: string, htmlContent: string) {
  printTableOrReceipt(title, htmlContent);
}

/**
 * Export data array to an Excel formatted file (.xls) with full Arabic UTF-8 support
 */
export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  let tableHtml = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
      th { background-color: #0891b2; color: #ffffff; font-weight: bold; border: 1px solid #cccccc; padding: 8px; text-align: center; }
      td { border: 1px solid #cccccc; padding: 6px; text-align: center; font-family: 'Cairo', sans-serif; }
    </style>
  </head>
  <body dir="rtl">
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr>${r.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ''}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
