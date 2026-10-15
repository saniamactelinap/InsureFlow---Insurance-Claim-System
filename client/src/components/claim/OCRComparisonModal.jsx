import { formatINR } from '../../utils/currency';
import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Sparkles, Check, AlertTriangle, Edit3, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const OCRComparisonModal = ({ isOpen, onClose, ocrJob, claim, onUpdated }) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    detectedAmount: ocrJob?.extractedFields?.detectedAmount || 0,
    detectedDate: ocrJob?.extractedFields?.detectedDate || '',
    invoiceOrBillNumber: ocrJob?.extractedFields?.invoiceOrBillNumber || '',
    issuerName: ocrJob?.extractedFields?.issuerName || '',
    policyNumberFound: ocrJob?.extractedFields?.policyNumberFound || '',
  });
  const [auditNote, setAuditNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!ocrJob) return null;

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!auditNote.trim()) {
      showToast('Please provide an audit justification note for manual correction.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await api.patch(`/ocr/jobs/${ocrJob._id}/correct`, {
        correctedFields: formData,
        auditNote: auditNote.trim(),
      });
      if (res.data.success) {
        showToast('OCR extracted fields corrected and audited successfully.', 'success');
        setIsEditing(false);
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update fields', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confidence = ocrJob.confidenceScore || 0;
  let confidenceColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (confidence < 60) {
    confidenceColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (confidence < 80) {
    confidenceColor = 'text-amber-600 bg-amber-50 border-amber-200';
  }

  const getEngineLabel = (provider) => {
    switch (provider) {
      case 'pdf_parse': return 'PDF Text Parser';
      case 'scanned_pdf_ocr': return 'Scanned PDF OCR (Tesseract)';
      case 'tesseract': return 'Tesseract OCR Engine';
      default: return provider ? provider.toUpperCase() : 'OCR Engine';
    }
  };

  const fields = ocrJob.correctedFields && Object.keys(ocrJob.correctedFields).length > 0
    ? { ...ocrJob.extractedFields, ...ocrJob.correctedFields }
    : ocrJob.extractedFields;

  const detectedAmt = fields?.detectedAmount != null && fields?.detectedAmount !== '' ? Number(fields.detectedAmount) : null;
  const hasAmountMismatch = detectedAmt !== null && claim?.requestedAmount && Math.abs(claim.requestedAmount - detectedAmt) > 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Intelligent Document Extraction (OCR) Review" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Top Header Banner with Confidence & Status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Engine: {getEngineLabel(ocrJob.provider)}</div>
              <div className="text-xs text-slate-500">Processed in {ocrJob.processingDurationMs || 350}ms</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ocrJob.reviewStatus && (
              <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
                ocrJob.reviewStatus === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {ocrJob.reviewStatus === 'VERIFIED' ? 'Verified Extraction' : 'Needs Officer Review'}
              </div>
            )}
            <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${confidenceColor}`}>
              <span>Confidence: {confidence}%</span>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Cancel Edit' : 'Correct Fields'}
            </button>
          </div>
        </div>

        {/* Amount Mismatch Banner */}
        {hasAmountMismatch && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Claim Discrepancy Detected:</span> Customer filed for {formatINR(claim.requestedAmount)}, but document bill total is {formatINR(detectedAmt)} (variance: {formatINR(Math.abs(claim.requestedAmount - detectedAmt))}).
            </div>
          </div>
        )}

        {/* Comparison Grid: Customer vs OCR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Customer Entered Data */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Customer Entered Claim Values
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
            </div>
          </div>

          {/* Right: OCR Extracted Fields */}
          <div className="border border-slate-200 rounded-xl p-4 bg-blue-50/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Extracted & Normalized OCR Entities
            </h4>
            {isEditing ? (
              <form onSubmit={handleSaveCorrection} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Detected Total Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.detectedAmount}
                    onChange={(e) => setFormData({ ...formData, detectedAmount: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Invoice / Bill Number</label>
                  <input
                    type="text"
                    value={formData.invoiceOrBillNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceOrBillNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Detected Document Date</label>
                  <input
                    type="text"
                    value={formData.detectedDate}
                    onChange={(e) => setFormData({ ...formData, detectedDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Issuer Name (Hospital/Workshop)</label>
                  <input
                    type="text"
                    value={formData.issuerName}
                    onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Audit Note / Rationale <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={auditNote}
                    onChange={(e) => setAuditNote(e.target.value)}
                    placeholder="Explain why field was adjusted..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
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
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                  >
                    {saving ? 'Saving...' : 'Save & Audit'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Detected Total Amount:</span>
                  <span className="font-bold text-slate-900">
                    {detectedAmt !== null ? (
                      formatINR(detectedAmt)
                    ) : (
                      <span className="text-slate-400 font-normal italic">Not detected</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Detected Date:</span>
                  <span className="font-semibold text-slate-900">{fields?.detectedDate || <span className="text-slate-400 font-normal italic">Not detected</span>}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Invoice / Bill #:</span>
                  <span className="font-mono text-slate-900">{fields?.invoiceOrBillNumber || <span className="text-slate-400 font-normal italic">Not detected</span>}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Issuer / Hospital / Garage:</span>
                  <span className="font-semibold text-slate-900">{fields?.issuerName || <span className="text-slate-400 font-normal italic">Not detected</span>}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Patient / Insured Name:</span>
                  <span className="font-semibold text-slate-900">{fields?.patientName || fields?.patientOrVehicleId || <span className="text-slate-400 font-normal italic">Not detected</span>}</span>
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
              </div>
            )}
          </div>
        </div>

        {/* Audit Note History if already corrected */}
        {ocrJob.correctedAt && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Officer Correction Applied:</span> {ocrJob.correctionAuditNote}
              <div className="text-[10px] text-amber-700 mt-0.5">
                Adjusted on {new Date(ocrJob.correctedAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Raw Text Accordion */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-3 bg-slate-50 font-bold text-xs text-slate-700">Raw Recognized OCR Text</div>
          <div className="p-3 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-600 bg-slate-900 text-slate-200 whitespace-pre-wrap">
            {ocrJob.rawText || 'No raw text recognized.'}
          </div>
        </div>
      </div>
    </Modal>
  );
};
