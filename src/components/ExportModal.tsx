import React, { useState } from 'react';
import { ARCHITECTURE_MODULES, SYSTEM_OVERVIEW } from '../data/architectureData';
import { FINANCIAL_METRICS } from '../data/financialFormulas';
import { BUSINESS_LIFECYCLE_FLOWS } from '../data/dataFlows';
import { IMPLEMENTATION_ROADMAP } from '../data/roadmapData';
import { MYSQL_COMPLETE_DDL } from '../data/mysqlSchema';
import { X, Download, Copy, Check, FileText, Database } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [exportType, setExportType] = useState<'markdown' | 'sql'>('markdown');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const generateFullMarkdown = () => {
    let md = `# وثيقة المعمارية الهندسية ونظام المحاسبة المزدوج\n`;
    md += `## متجر الحواسيب والشبكات + نشاط تطوير البرمجيات الحرة\n\n`;
    md += `**قاعدة البيانات المعتمدة:** MySQL 8.0+ (InnoDB Engine, utf8mb4_unicode_ci)\n`;
    md += `**توجيه واجهة المستخدم:** Arabic RTL\n`;
    md += `**الاستقلالية التقنية:** النظام مستقل تماماً عن أي لغة برمجة (Language-Agnostic Core)\n\n`;
    md += `---\n\n`;

    md += `## 1. ملخص وحدات الأعمال (Business Units)\n`;
    SYSTEM_OVERVIEW.businessUnits.forEach(u => {
      md += `### ${u.name} (Code: ${u.code})\n`;
      u.scope.forEach(s => md += `- ${s}\n`);
      md += `\n`;
    });

    md += `---\n\n## 2. الركائز المعمارية الـ 23\n\n`;
    ARCHITECTURE_MODULES.forEach(m => {
      md += `### ${m.title}\n`;
      md += `*${m.titleEn}*\n\n`;
      md += `**الملخص:** ${m.summary}\n\n`;
      md += `**قواعد الأعمال:**\n`;
      m.businessRules.forEach(r => md += `- ${r}\n`);
      md += `\n**تدفق البيانات:** ${m.dataFlowDescription}\n\n`;
      if (m.accountingImpact.length > 0) {
        md += `**الأثر المحاسبي:**\n`;
        m.accountingImpact.forEach(a => md += `- مدين: ${a.debit} | دائن: ${a.credit} (${a.notes})\n`);
        md += `\n`;
      }
      md += `---\n\n`;
    });

    md += `## 3. مؤشرات الحسابات المالية الـ 15\n\n`;
    FINANCIAL_METRICS.forEach(f => {
      md += `### ${f.nameAr}\n`;
      md += `**المعادلة:** \`${f.formula}\`\n\n`;
      md += `**الوصف:** ${f.description}\n\n`;
      md += `\`\`\`sql\n${f.sqlQuerySample}\n\`\`\`\n\n`;
    });

    md += `---\n\n## 4. خارطة طريق التنفيذ (10 مراحل)\n\n`;
    IMPLEMENTATION_ROADMAP.forEach(r => {
      md += `### المرحلة ${r.phaseNumber}: ${r.titleAr} (${r.durationWeeks})\n`;
      md += `**الهدف:** ${r.goalAr}\n\n`;
      md += `**المخرجات:**\n`;
      r.deliverables.forEach(d => md += `- ${d}\n`);
      md += `\n`;
    });

    return md;
  };

  const contentToExport = exportType === 'markdown' ? generateFullMarkdown() : MYSQL_COMPLETE_DDL;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = exportType === 'markdown' ? 'system_architecture_blueprint.md' : 'mysql_schema.sql';
    const mime = exportType === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([contentToExport], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">تصدير الوثيقة الهندسية والمعمارية</h3>
              <p className="text-xs text-slate-400">تصدير كامل شامل لكافة الركائز، قواعد البيانات، والخرائط المالية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector & Actions */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportType('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                exportType === 'markdown' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown (.md) - الوثيقة الكاملة</span>
            </button>

            <button
              onClick={() => setExportType('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                exportType === 'sql' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>MySQL Schema (.sql) - كود الجداول</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل الملف</span>
            </button>
          </div>
        </div>

        {/* Code / Text Preview */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300">
          <pre className="whitespace-pre-wrap leading-relaxed">
            {contentToExport}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>جاهز للاستخدام مع أي لغة برمجة (Node.js, Go, Python, PHP, C#...)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
