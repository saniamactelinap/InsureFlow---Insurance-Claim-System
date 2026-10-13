import React, { useState } from 'react';
import { FileText, ExternalLink, Download, Eye, AlertCircle } from 'lucide-react';

export const DocumentViewer = ({ document }) => {
  const [showFull, setShowFull] = useState(false);

  if (!document) return null;

  const isPdf = document.mimeType === 'application/pdf' || document.fileName.toLowerCase().endsWith('.pdf');
  const isImage = document.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(document.fileName);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="font-semibold text-slate-800 truncate">{document.originalName}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
            {document.documentCategory}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </a>
          <button
            onClick={() => setShowFull(!showFull)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
          >
            <Eye className="w-3.5 h-3.5" />
            {showFull ? 'Collapse' : 'Preview'}
          </button>
        </div>
      </div>

      {showFull && (
        <div className="p-4 bg-slate-900/5 flex justify-center items-center min-h-[300px] max-h-[500px] overflow-auto">
          {isImage ? (
            <img
              src={document.fileUrl}
              alt={document.originalName}
              className="max-h-[460px] max-w-full rounded-lg shadow border border-slate-200 object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={document.fileUrl}
              title={document.originalName}
              className="w-full h-[460px] rounded-lg border border-slate-200"
            />
          ) : (
            <div className="text-center p-6 text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm">Direct preview unavailable for this file format.</p>
              <a
                href={document.fileUrl}
                download
                className="mt-2 inline-flex items-center gap-1 text-blue-600 text-xs font-semibold underline"
              >
                <Download className="w-3.5 h-3.5" /> Download file
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
