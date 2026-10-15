import React, { useState } from 'react';
import { MYSQL_COMPLETE_DDL, SCHEMA_TABLE_LIST, TableDefinition } from '../data/mysqlSchema';
import { 
  Database, 
  Table as TableIcon, 
  Key, 
  Download, 
  Copy, 
  Check, 
  Search, 
  ShieldCheck, 
  Layers,
  Code2
} from 'lucide-react';

export const DatabaseSchemaViewer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'tables' | 'sql'>('tables');
  const [selectedTable, setSelectedTable] = useState<TableDefinition>(SCHEMA_TABLE_LIST[0]);
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const filteredTables = SCHEMA_TABLE_LIST.filter((tbl) => 
    tbl.name.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
    tbl.nameAr.includes(searchTableQuery) ||
    tbl.descriptionAr.includes(searchTableQuery)
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadSqlFile = () => {
    const blob = new Blob([MYSQL_COMPLETE_DDL], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dual_business_erp_mysql_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">مخطط قاعدة بيانات MySQL 8.0+ (Schema & DDL)</h2>
            <p className="text-xs text-slate-400">محرك InnoDB | الترميز utf8mb4_unicode_ci | قيود المفاتيح الأجنبية والمعاملات الذرية ACID</p>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('tables')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'tables' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              استعراض الجداول والحقول
            </button>
            <button
              onClick={() => setViewMode('sql')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'sql' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              سكريبت SQL DDL الكامل
            </button>
          </div>

          <button
            onClick={() => copyToClipboard(MYSQL_COMPLETE_DDL)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ' : 'نسخ SQL'}</span>
          </button>

          <button
            onClick={downloadSqlFile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل .sql</span>
          </button>
        </div>
      </div>

      {viewMode === 'tables' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Table List Sidebar */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث عن جدول..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {filteredTables.map((tbl) => (
                <button
                  key={tbl.name}
                  onClick={() => setSelectedTable(tbl)}
                  className={`w-full text-right p-3 rounded-lg text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                    selectedTable.name === tbl.name
                      ? 'bg-indigo-500/20 text-white border border-indigo-500/40 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 bg-slate-950/30 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-400">{tbl.name}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      {tbl.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300">{tbl.nameAr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Detail View */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTable && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 space-y-5 shadow-lg">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-mono font-black text-lg text-white">{selectedTable.name}</h3>
                      <span className="text-xs text-slate-400">({selectedTable.nameAr})</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{selectedTable.descriptionAr}</p>
                  </div>

                  <span className="text-[11px] font-mono px-3 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 self-start">
                    {selectedTable.columns.length} أعمدة
                  </span>
                </div>

                {/* Columns Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">اسم العمود (Field)</th>
                        <th className="p-3">النوع (Type)</th>
                        <th className="p-3">المفتاح / المرجع</th>
                        <th className="p-3">الوصف بالعربية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                      {selectedTable.columns.map((col, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-slate-200">
                            {col.name}
                            {col.isPrimary && (
                              <span className="mr-1.5 text-[10px] font-sans px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                PK
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-cyan-400">{col.type}</td>
                          <td className="p-3 text-slate-400">
                            {col.foreignKey ? (
                              <span className="text-indigo-400 flex items-center gap-1">
                                <Key className="w-3 h-3 shrink-0" />
                                FK: {col.foreignKey}
                              </span>
                            ) : col.isPrimary ? (
                              <span className="text-amber-400">Primary Key</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300 font-sans">{col.descriptionAr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Indexes */}
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 block mb-2">الفهارس وقيود الأداء (Indexes & Constraints):</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedTable.indexes.map((idx, i) => (
                      <code key={i} className="text-[11px] font-mono bg-slate-900 text-cyan-300 px-2.5 py-1 rounded border border-slate-800">
                        {idx}
                      </code>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      ) : (
        /* Full SQL DDL View */
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 relative shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs text-slate-400">
            <span className="font-mono">schema.sql (MySQL 8.0+ Compatible DDL)</span>
            <span>UTF-8 Unicode | InnoDB Engine</span>
          </div>
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre p-2 leading-relaxed max-h-[700px]">
            {MYSQL_COMPLETE_DDL}
          </pre>
        </div>
      )}

    </div>
  );
};
