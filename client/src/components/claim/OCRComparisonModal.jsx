import React, { useState } from 'react';
import { formatINR } from '../../utils/currency';
import { Modal } from '../common/Modal';
import {
  Sparkles,
  Check,
  AlertTriangle,
  Edit3,
  ShieldAlert,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  HelpCircle,
  Eye,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const OCRComparisonModal = ({ isOpen, onClose, ocrJob: initialJob, claim, document, onUpdated }) => {
  const { showToast } = useToast();
  const [ocrJob, setOcrJob] = useState(initialJob);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' | 'preview' | 'engines' | 'lineItems'
  const [currentPage, setCurrentPage] = useState(1);
  const [reprocessing, setReprocessing] = useState(false);

  // Sync state if initialJob changes
  React.useEffect(() => {
    setOcrJob(initialJob);
    if (initialJob?.extractedFields) {
      setFormData({
        detectedAmount: initialJob.extractedFields.detectedAmount ?? '',
        detectedDate: initialJob.extractedFields.detectedDate || '',
        invoiceOrBillNumber: initialJob.extractedFields.invoiceOrBillNumber || '',
        issuerName: initialJob.extractedFields.issuerName || '',
        patientOrVehicleId: initialJob.extractedFields.patientOrVehicleId || '',
        policyNumberFound: initialJob.extractedFields.policyNumberFound || '',
      });
    }
  }, [initialJob]);

  const [formData, setFormData] = useState({
    detectedAmount: initialJob?.extractedFields?.detectedAmount ?? '',
    detectedDate: initialJob?.extractedFields?.detectedDate || '',
    invoiceOrBillNumber: initialJob?.extractedFields?.invoiceOrBillNumber || '',
    issuerName: initialJob?.extractedFields?.issuerName || '',
    patientOrVehicleId: initialJob?.extractedFields?.patientOrVehicleId || '',
    policyNumberFound: initialJob?.extractedFields?.policyNumberFound || '',
  });

  const [auditNote, setAuditNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!ocrJob) return null;

  const doc = document || (typeof ocrJob.document === 'object' ? ocrJob.document : null);
  const totalPages = ocrJob.sourcePagesCount || 1;

  const isPdf =
    doc?.mimeType === 'application/pdf' ||
    doc?.fileName?.toLowerCase().endsWith('.pdf') ||
    doc?.fileUrl?.toLowerCase().endsWith('.pdf');
  const isImage =
    doc?.mimeType?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp)$/i.test(doc?.fileName || doc?.fileUrl || '');

  // Active fields merging corrections if present
  const fields = ocrJob.correctedFields && Object.keys(ocrJob.correctedFields).length > 0
    ? { ...ocrJob.extractedFields, ...ocrJob.correctedFields }
    : ocrJob.extractedFields;

  const detectedAmt =
    fields?.detectedAmount != null && fields?.detectedAmount !== ''
      ? Number(fields.detectedAmount)
      : null;

  // Discrepancy details
  const discrepancy = ocrJob.discrepancy || {};
  const hasAmountDiscrepancy = discrepancy.hasDiscrepancy;

  // Confidence styling
  const confidence = ocrJob.confidenceScore || 0;
  let confidenceColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (confidence < 60) {
    confidenceColor = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (confidence < 80) {
    confidenceColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  const getEngineBadge = (provider) => {
    switch (provider) {
      case 'hybrid':
        return { label: 'Hybrid: Tesseract + Gemini Vision', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'gemini_vision':
        return { label: 'Google Gemini Vision AI', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'tesseract':
        return { label: 'Tesseract Local OCR', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'pdf_parse':
        return { label: 'PDF Digital Text Layer', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'scanned_pdf_ocr':
        return { label: 'Scanned PDF OCR (Tesseract)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: provider ? provider.toUpperCase() : 'OCR Engine', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const engineBadge = getEngineBadge(ocrJob.provider);

  // Field Confidence Category Helper
  const getFieldConfidenceBadge = (key) => {
    const meta = ocrJob.fieldMetadata?.[key];
    if (!meta) {
      if (fields?.[key] == null) {
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-medium">Not detected</span>;
      }
      return <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-medium">Standard</span>;
    }

    if (meta.isAmbiguous) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">Ambiguous</span>;
    }
    const score = meta.confidence || confidence;
    if (score >= 85) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium">High ({score}%)</span>;
    } else if (score >= 65) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-medium">Med ({score}%)</span>;
    } else {
      return <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 font-medium">Low ({score}%)</span>;
    }
  };

  // Handle Manual Correction Save
  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!auditNote.trim()) {
      showToast('Please provide an audit justification note for manual correction.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await api.patch(`/ocr/jobs/${ocrJob._id}/correct`, {
        correctedFields: {
          ...formData,
          detectedAmount: formData.detectedAmount === '' ? null : Number(formData.detectedAmount),
        },
        auditNote: auditNote.trim(),
      });
      if (res.data.success) {
        showToast('OCR extracted fields corrected and audited successfully.', 'success');
        setOcrJob(res.data.data);
        setIsEditing(false);
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update fields', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Retry with Vision
  const handleReprocessWithVision = async () => {
    const docId = doc?._id || ocrJob.document;
    if (!docId) {
      showToast('Document ID not found for reprocessing.', 'error');
      return;
    }

    try {
      setReprocessing(true);
      showToast('Initiating high-resolution Gemini Vision reprocessing...', 'info');
      const res = await api.post(`/ocr/document/${docId}/reprocess`, {
        forceVision: true,
      });

      if (res.data.success) {
        showToast(`Reprocessing completed using ${res.data.data.provider}!`, 'success');
        setOcrJob(res.data.data);
        if (onUpdated) onUpdated();
      } else {
        showToast(res.data.message || 'Reprocessing failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reprocess with Gemini Vision', 'error');
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Intelligent Document Extraction (Hybrid OCR & Vision) Review"
      maxWidth="max-w-5xl"
    >
      <div className="space-y-5">
        {/* TOP STATUS BAR: Engine, Status, Confidence, Actions */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-md border text-xs font-bold ${engineBadge.color}`}>
                  {engineBadge.label}
                </span>
                {ocrJob.handwritingDetected && (
                  <span className="px-2 py-0.5 rounded-md border text-[11px] font-bold bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> Handwritten
                  </span>
                )}
                {ocrJob.status && (
                  <span className="px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                    {ocrJob.status}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Document: <span className="font-semibold text-slate-700">{doc?.originalName || 'Claim Document'}</span> ({ocrJob.documentType || 'document'}) • {ocrJob.processingDurationMs || 0}ms
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${confidenceColor}`}>
              <span>Confidence: {confidence}%</span>
            </div>

            <button
              onClick={handleReprocessWithVision}
              disabled={reprocessing}
              className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Run multimodal Gemini Vision pass"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
              {reprocessing ? 'Processing Vision...' : 'Retry with Vision'}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Cancel Edit' : 'Correct Fields'}
            </button>
          </div>
        </div>

        {/* HONEST DISCREPANCY & AMBIGUITY ALERTS */}
        {hasAmountDiscrepancy ? (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Claim Discrepancy Note:</span>
              <p className="leading-relaxed">{discrepancy.explanation}</p>
            </div>
          </div>
        ) : (
          detectedAmt !== null && claim?.requestedAmount && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Document Total Verified:</strong> Bill amount of {formatINR(detectedAmt)} matches claim requested amount.
              </span>
            </div>
          )
        )}

        {/* CANDIDATE READINGS FOR AMBIGUOUS HANDWRITING */}
        {ocrJob.candidateReadings?.totalAmount && ocrJob.candidateReadings.totalAmount.length > 1 && (
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Handwriting Ambiguity Detected:</span> The vision model found multiple plausible readings for the total bill amount.
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-semibold text-blue-800">Candidate readings:</span>
                {ocrJob.candidateReadings.totalAmount.map((cand, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, detectedAmount: cand });
                      setIsEditing(true);
                      showToast(`Selected candidate reading: ${formatINR(cand)}. Click Save & Audit to confirm.`, 'info');
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-blue-300 font-bold text-blue-700 hover:bg-blue-100 text-xs transition"
                  >
                    {formatINR(cand)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION: Fields | Document Preview | Engine Comparison | Line Items */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('fields')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'fields'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Extracted Entities
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Document Preview {totalPages > 1 && `(${totalPages} Pages)`}
          </button>
          {ocrJob.engineComparison?.disagreements?.length > 0 && (
            <button
              onClick={() => setActiveTab('engines')}
              className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'engines'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-amber-600 hover:text-amber-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Cross-Engine Disagreement ({ocrJob.engineComparison.disagreements.length})
            </button>
          )}
          {fields?.lineItems && fields.lineItems.length > 0 && (
            <button
              onClick={() => setActiveTab('lineItems')}
              className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'lineItems'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Itemized Breakdown ({fields.lineItems.length})
            </button>
          )}
        </div>

        {/* TAB 1: EXTRACTED ENTITIES & CLAIM COMPARISON */}
        {activeTab === 'fields' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Customer Claim Reference Values */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Customer Claim Application
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Claim Requested Amount:</span>
                  <span className="font-bold text-slate-900">{formatINR(claim?.requestedAmount)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Incident Date:</span>
                  <span className="font-semibold text-slate-900">
                    {claim?.incidentDate ? new Date(claim.incidentDate).toISOString().split('T')[0] : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Policy Category:</span>
                  <span className="font-semibold text-slate-900">{claim?.category}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Claim Reference:</span>
                  <span className="font-mono text-slate-900">{claim?.claimReference}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Claim Type:</span>
                  <span className="font-semibold text-slate-900">{claim?.claimType || 'REIMBURSEMENT'}</span>
                </div>
              </div>
            </div>

            {/* Right: OCR Extracted Fields / Manual Correction Form */}
            <div className="border border-slate-200 rounded-xl p-4 bg-blue-50/20 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Extracted & Verified Entities
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Method: {ocrJob.provider}
                </span>
              </h4>

              {isEditing ? (
                <form onSubmit={handleSaveCorrection} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Detected Total Amount (₹) <span className="text-slate-400 font-normal">(Leave empty if not detected)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.detectedAmount}
                      onChange={(e) => setFormData({ ...formData, detectedAmount: e.target.value })}
                      placeholder="e.g. 15000"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Invoice / Bill Number</label>
                    <input
                      type="text"
                      value={formData.invoiceOrBillNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceOrBillNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Detected Document Date</label>
                    <input
                      type="text"
                      value={formData.detectedDate}
                      onChange={(e) => setFormData({ ...formData, detectedDate: e.target.value })}
                      placeholder="YYYY-MM-DD or DD/MM/YYYY"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Issuer Name (Hospital / Workshop)</label>
                    <input
                      type="text"
                      value={formData.issuerName}
                      onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Patient or Insured Name</label>
                    <input
                      type="text"
                      value={formData.patientOrVehicleId}
                      onChange={(e) => setFormData({ ...formData, patientOrVehicleId: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Audit Note / Correction Rationale <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={auditNote}
                      onChange={(e) => setAuditNote(e.target.value)}
                      placeholder="Explain why field was adjusted based on document inspection..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                    >
                      {saving ? 'Saving...' : 'Save & Audit'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Detected Total Amount:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {detectedAmt !== null ? (
                          formatINR(detectedAmt)
                        ) : (
                          <span className="text-slate-400 font-normal italic">Not detected</span>
                        )}
                      </span>
                      {getFieldConfidenceBadge('totalAmount')}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Invoice / Bill #:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-900">
                        {fields?.invoiceOrBillNumber || fields?.invoiceNumber || <span className="text-slate-400 font-normal italic">Not detected</span>}
                      </span>
                      {getFieldConfidenceBadge('invoiceNumber')}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Document Date:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {fields?.detectedDate || fields?.invoiceDate || <span className="text-slate-400 font-normal italic">Not detected</span>}
                      </span>
                      {getFieldConfidenceBadge('invoiceDate')}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Issuer / Facility:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                        {fields?.issuerName || fields?.hospitalName || <span className="text-slate-400 font-normal italic">Not detected</span>}
                      </span>
                      {getFieldConfidenceBadge('hospitalName')}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Patient / Insured:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                        {fields?.patientOrVehicleId || fields?.patientName || <span className="text-slate-400 font-normal italic">Not detected</span>}
                      </span>
                      {getFieldConfidenceBadge('patientName')}
                    </div>
                  </div>
                  {fields?.subtotal != null && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-semibold text-slate-900">{formatINR(fields.subtotal)}</span>
                    </div>
                  )}
                  {fields?.taxAmount != null && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Taxes:</span>
                      <span className="font-semibold text-slate-900">{formatINR(fields.taxAmount)}</span>
                    </div>
                  )}
                  {fields?.paymentStatus && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Payment Status:</span>
                      <span className="font-bold text-emerald-700">{fields.paymentStatus}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENT PREVIEW WITH PAGE NAVIGATION */}
        {activeTab === 'preview' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5">
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">{doc?.originalName || 'Document'}</span>
                {totalPages > 1 && (
                  <span className="text-slate-500 font-medium">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 rounded bg-white border border-slate-300 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] px-1 font-semibold">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1 rounded bg-white border border-slate-300 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {doc?.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 flex justify-center items-center min-h-[420px] max-h-[580px] overflow-auto bg-slate-950/5">
              {isImage && doc?.fileUrl ? (
                <img
                  src={doc.fileUrl}
                  alt={doc.originalName || 'Document preview'}
                  className="max-h-[540px] max-w-full rounded-lg shadow-sm border border-slate-200 object-contain bg-white"
                />
              ) : isPdf && doc?.fileUrl ? (
                <iframe
                  src={`${doc.fileUrl}#page=${currentPage}`}
                  title={doc.originalName || 'PDF Viewer'}
                  className="w-full h-[540px] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Preview not directly embeddable for this format.</p>
                  {doc?.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-blue-600 text-xs font-semibold underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View original file
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CROSS-ENGINE DISAGREEMENT VIEW */}
        {activeTab === 'engines' && ocrJob.engineComparison && (
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Cross-Engine Extraction Comparison
              </h4>
              <span className="text-xs font-bold text-slate-600">
                Engine Agreement Score: {ocrJob.engineComparison.agreementScore}%
              </span>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
              <strong>Engine Discrepancy Found:</strong> The local Tesseract OCR engine and Gemini Vision produced differing readings on key insurance fields. Review both signals below before confirming.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="py-2 px-3">Field Entity</th>
                    <th className="py-2 px-3">Tesseract Reading</th>
                    <th className="py-2 px-3">Gemini Vision Reading</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-700">Total Amount</td>
                    <td className="py-2 px-3 font-mono text-slate-900">
                      {ocrJob.engineComparison.tesseract?.totalAmount != null ? formatINR(ocrJob.engineComparison.tesseract.totalAmount) : 'Not detected'}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">
                      {ocrJob.engineComparison.gemini?.totalAmount != null ? formatINR(ocrJob.engineComparison.gemini.totalAmount) : 'Not detected'}
                    </td>
                    <td className="py-2 px-3">
                      {ocrJob.engineComparison.tesseract?.totalAmount === ocrJob.engineComparison.gemini?.totalAmount ? (
                        <span className="text-emerald-700 font-bold">Agreed</span>
                      ) : (
                        <span className="text-amber-700 font-bold">Differing</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-700">Invoice Number</td>
                    <td className="py-2 px-3 font-mono text-slate-900">
                      {ocrJob.engineComparison.tesseract?.invoiceNumber || 'Not detected'}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">
                      {ocrJob.engineComparison.gemini?.invoiceNumber || 'Not detected'}
                    </td>
                    <td className="py-2 px-3">
                      {ocrJob.engineComparison.tesseract?.invoiceNumber === ocrJob.engineComparison.gemini?.invoiceNumber ? (
                        <span className="text-emerald-700 font-bold">Agreed</span>
                      ) : (
                        <span className="text-amber-700 font-bold">Differing</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-700">Facility / Hospital</td>
                    <td className="py-2 px-3 text-slate-900">
                      {ocrJob.engineComparison.tesseract?.hospitalName || 'Not detected'}
                    </td>
                    <td className="py-2 px-3 font-bold text-blue-700">
                      {ocrJob.engineComparison.gemini?.hospitalName || 'Not detected'}
                    </td>
                    <td className="py-2 px-3">
                      {ocrJob.engineComparison.tesseract?.hospitalName === ocrJob.engineComparison.gemini?.hospitalName ? (
                        <span className="text-emerald-700 font-bold">Agreed</span>
                      ) : (
                        <span className="text-amber-700 font-bold">Differing</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ITEMIZED LINE ITEMS BREAKDOWN */}
        {activeTab === 'lineItems' && fields?.lineItems && (
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Itemized Medical Charges & Services</span>
              <span className="text-slate-500 font-normal">{fields.lineItems.length} items extracted</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Description / Service</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Rate</th>
                    <th className="py-2 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{item.quantity || 1}</td>
                      <td className="py-2 px-3 text-right text-slate-600 font-mono">
                        {item.unitPrice ? formatINR(item.unitPrice) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                        {item.amount != null ? formatINR(item.amount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT CORRECTION TRAIL BANNER IF PREVIOUSLY MODIFIED */}
        {ocrJob.correctedAt && (
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Audited Officer Correction on Record:</span>
              <p className="italic text-amber-900 mt-0.5">"{ocrJob.correctionAuditNote}"</p>
              <div className="text-[10px] text-amber-700 mt-1">
                Modified on {new Date(ocrJob.correctedAt).toLocaleString()}
                {ocrJob.correctedBy?.name && ` by ${ocrJob.correctedBy.name}`}
              </div>
            </div>
          </div>
        )}

        {/* RAW RECOGNIZED OCR TEXT ACCORDION */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-2.5 bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-between">
            <span>Raw Optical & Vision Output</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {ocrJob.rawText ? `${ocrJob.rawText.length} characters` : 'Empty'}
            </span>
          </div>
          <div className="p-3 max-h-36 overflow-y-auto font-mono text-[11px] bg-slate-900 text-slate-200 whitespace-pre-wrap rounded-b-xl">
            {ocrJob.rawText || 'No raw optical text generated.'}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OCRComparisonModal;
