
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';

interface PrintPreviewProps {
  children: React.ReactNode;
  onBack: () => void;
  title: string;
  orientation?: 'portrait' | 'landscape';
  initialAction?: 'pdf' | 'print';
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ 
  children, 
  onBack, 
  title, 
  orientation = 'portrait',
  initialAction 
}) => {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePrint = async () => {
    window.print();
  };

  useEffect(() => {
    if (initialAction) {
        const timer = setTimeout(handlePrint, 500);
        return () => clearTimeout(timer);
    }
  }, [initialAction]);

  const previewWidth = orientation === 'landscape' ? '297mm' : '210mm';

  const content = (
    <div id="print-preview-overlay" className="fixed inset-0 z-[200] bg-slate-800/95 backdrop-blur-sm flex flex-col animate-fade-in text-slate-900">
      <style>{`
        @media print {
          @page {
            size: ${orientation};
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #root {
            display: none !important;
          }
          #print-preview-overlay, #print-preview-overlay * {
            visibility: visible;
          }
          #print-preview-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            z-index: 99999 !important;
            display: block !important;
            overflow: visible !important;
          }
          #print-content {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          #print-toolbar {
            display: none !important;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background-color: white !important;
            width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <header id="print-toolbar" className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg shrink-0">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Printer className="text-blue-400" />
            Baskı Önizleme
          </h2>
          <p className="text-xs text-slate-400">{title} ({orientation === 'landscape' ? 'Yatay' : 'Dikey'})</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors border border-slate-600"
          >
            <X size={16} /> Kapat
          </button>
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold shadow-md transition-all hover:scale-105"
          >
            <Printer size={16} /> PDF Kaydet / Yazdır
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-800/50 print:bg-white print:p-0 print:overflow-visible print:block">
        <div 
          id="print-content" 
          style={{ maxWidth: previewWidth }}
          className="bg-white shadow-2xl w-full min-h-[297mm] mx-auto origin-top print:min-h-0 print:w-full print:mx-0 print:max-w-none"
        >
          {children}
        </div>
      </main>
    </div>
  );

  return createPortal(content, document.body);
};
