import React, { useState } from 'react';
import { Download, Copy, Eye, EyeOff, FileSpreadsheet, FileText, ClipboardCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';
import 'jspdf-autotable';

const DataTable = ({ columns, data, fileName = 'data-export' }) => {
  const { t } = useTranslation();
  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key));
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [copied, setCopied] = useState(false);

  // Toggle column visibility
  const toggleColumn = (key) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Export to Excel
  const exportExcel = () => {
    const exportData = data.map(row => {
      const filteredRow = {};
      columns.filter(col => visibleColumns.includes(col.key)).forEach(col => {
        filteredRow[col.label] = row[col.key];
      });
      return filteredRow;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = columns.filter(col => visibleColumns.includes(col.key)).map(col => col.label);
    const tableRows = data.map(row => 
      columns.filter(col => visibleColumns.includes(col.key)).map(col => row[col.key])
    );

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { font: 'helvetica', fontSize: 8 },
      headStyles: { fillColor: [0, 146, 142] }
    });
    doc.text(fileName, 14, 15);
    doc.save(`${fileName}.pdf`);
  };

  // Copy to Clipboard
  const copyToClipboard = () => {
    const header = columns.filter(col => visibleColumns.includes(col.key)).map(col => col.label).join('\t');
    const rows = data.map(row => 
      columns.filter(col => visibleColumns.includes(col.key)).map(col => row[col.key]).join('\t')
    ).join('\n');
    
    const text = `${header}\n${rows}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowColumnToggle(!showColumnToggle)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors relative"
          >
            {showColumnToggle ? <EyeOff size={16} /> : <Eye size={16} />} {t('common.show_hide_cols')}
          </button>
          
          {showColumnToggle && (
            <div className="absolute mt-12 bg-white border border-gray-200 shadow-xl rounded-xl p-3 z-30 min-w-[200px] grid grid-cols-1 gap-1">
              {columns.map(col => (
                <label key={col.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.includes(col.key)} 
                    onChange={() => toggleColumn(col.key)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={copyToClipboard} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-gray-600">
            {copied ? <ClipboardCheck size={16} className="text-green-500" /> : <Copy size={16} />} {copied ? t('common.copied') : t('common.copy')}
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-green-600">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-red-600">
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
                <th key={col.key} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
                  <td key={col.key} className="px-6 py-4 text-sm font-medium text-gray-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-400 font-medium">
                  {t('common.no_results')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
