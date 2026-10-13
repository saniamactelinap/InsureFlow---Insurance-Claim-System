import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusConfig = {
    DRAFT: { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    SUBMITTED: { label: 'Submitted', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    DOCUMENT_PROCESSING: { label: 'Document Processing', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    DOCUMENTS_REQUIRED: { label: 'Action Required: Documents Needed', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
    UNDER_REVIEW: { label: 'Under Review', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    SURVEYOR_ASSIGNED: { label: 'Surveyor Assigned', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    INSPECTION_IN_PROGRESS: { label: 'Inspection In Progress', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
    SURVEY_REPORT_SUBMITTED: { label: 'Survey Report Submitted', bg: 'bg-blue-50 text-blue-800 border-blue-300' },
    MANAGER_REVIEW: { label: 'Manager Review', bg: 'bg-orange-50 text-orange-800 border-orange-300' },
    APPROVED: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-300' },
    SETTLEMENT_PENDING: { label: 'Settlement Pending', bg: 'bg-teal-50 text-teal-800 border-teal-300' },
    SETTLEMENT_PROCESSING: { label: 'Settlement Processing', bg: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
    SETTLED: { label: 'Settled & Paid', bg: 'bg-green-100 text-green-900 border-green-400 font-bold' },
    CLOSED: { label: 'Closed', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const config = statusConfig[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
