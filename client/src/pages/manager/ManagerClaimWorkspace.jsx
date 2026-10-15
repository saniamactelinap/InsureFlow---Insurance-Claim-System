import { formatINR } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, AlertTriangle, ArrowLeft, CheckCircle, XCircle, 
  RotateCcw, FileText, User, Calendar, Clock, 
  Layers, Camera, ChevronRight, Eye 
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import DocumentViewer from '../../components/claim/DocumentViewer';
import TimelineView from '../../components/claim/TimelineView';

export default function ManagerClaimWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [claim, setClaim] = useState(null);
  const [surveyReport, setSurveyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Decision Modal States
  const [actionType, setActionType] = useState(null); // 'APPROVE' | 'REJECT' | 'RETURN'
  const [approvedAmount, setApprovedAmount] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  // Preview Document Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchClaimDetails();
  }, [id]);

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/claims/${id}`);
      const claimData = res.data.data;
      setClaim(claimData);
      setApprovedAmount(claimData.requestedAmount || '');

      // If surveyor was assigned, fetch survey report
      try {
        const surveyRes = await api.get(`/survey-reports/claim/${id}`);
        if (surveyRes.data.data) {
          setSurveyReport(surveyRes.data.data);
          // If survey estimated repair cost, default approval amount to assessed liability if appropriate
          if (surveyRes.data.data.assessmentAmount) {
            setApprovedAmount(surveyRes.data.data.assessmentAmount);
          }
        }
      } catch (err) {
        // Survey report may not exist for this claim
      }
    } catch (err) {
      showToast('Failed to load claim details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionNotes.trim()) {
      showToast('Decision notes/rationale is mandatory for audit compliance', 'error');
      return;
    }

    if (actionType === 'APPROVE' && (!approvedAmount || Number(approvedAmount) <= 0)) {
      showToast('Please provide a valid approved settlement amount', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (actionType === 'APPROVE') {
        await api.post(`/manager/claims/${id}/approve`, {
          approvedAmount: Number(approvedAmount),
          notes: decisionNotes,
          paymentMethod
        });
        showToast('Claim approved and settlement voucher generated', 'success');
      } else if (actionType === 'REJECT') {
        await api.post(`/manager/claims/${id}/reject`, {
          reason: decisionNotes
        });
        showToast('Claim rejected with audited notification sent to customer', 'info');
      } else if (actionType === 'RETURN') {
        await api.post(`/manager/claims/${id}/return`, {
          notes: decisionNotes
        });
        showToast('Claim returned to Insurance Officer queue for further clarification', 'info');
      }
      setActionType(null);
      fetchClaimDetails();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit decision', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700"></div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Claim file not found.</p>
        <Link to="/manager/decisions" className="text-navy-700 underline text-sm mt-2 inline-block">
          Return to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager/decisions')}
            className="p-2 bg-white border border-[#D9E1FA] hover:bg-[#F5F7FF] rounded-lg text-slate-600 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-navy-900">{claim.claimNumber}</h1>
              <StatusBadge status={claim.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Manager Adjudication & Settlement Authorization File</p>
          </div>
        </div>

        {/* Manager Action Trigger Buttons */}
        {claim.status === 'MANAGER_REVIEW' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActionType('RETURN'); setDecisionNotes(''); }}
              className="px-3.5 py-2 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return to Officer
            </button>
            <button
              onClick={() => { setActionType('REJECT'); setDecisionNotes(''); }}
              className="px-3.5 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject Claim
            </button>
            <button
              onClick={() => { setActionType('APPROVE'); setDecisionNotes(''); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Authorize Settlement
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: File Details & Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Claim Summary, Survey Report, Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Summary Card */}
          <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-700" /> Incident & Claim Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">Policyholder</p>
                <p className="font-semibold text-slate-800 mt-0.5">{claim.customer?.name}</p>
                <p className="text-xs text-slate-500">{claim.customer?.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Policy Number</p>
                <p className="font-semibold text-slate-800 mt-0.5">{claim.policyNumber}</p>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {claim.policySource}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Insurance Category</p>
                <p className="font-semibold text-slate-800 mt-0.5">{claim.insuranceCategory}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Incident Date</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(claim.incidentDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Requested Exposure</p>
                <p className="font-bold text-navy-900 mt-0.5 text-base">
                  {formatINR(claim.requestedAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Assigned Officer</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {claim.officer?.name || 'Assigned Staff'}
                </p>
              </div>
            </div>

            <div className="bg-[#F5F7FF] p-3 rounded-lg border border-slate-100 text-xs">
              <p className="font-semibold text-slate-700 mb-1">Incident Description:</p>
              <p className="text-slate-600 leading-relaxed">{claim.description}</p>
            </div>
          </div>

          {/* Surveyor Report Card (if present) */}
          {surveyReport ? (
            <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" /> Independent Surveyor Assessment
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Inspection Verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Inspecting Surveyor</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{surveyReport.surveyor?.name || 'Field Surveyor'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Inspection Date</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {new Date(surveyReport.inspectionDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Estimated Repair Cost</p>
                  <p className="font-bold text-navy-900 mt-0.5 text-base">
                    {formatINR(surveyReport.assessmentAmount)}
                  </p>
                </div>
                {surveyReport.salvageValue > 0 && (
                  <div>
                    <p className="text-xs text-slate-400">Salvage Allowance</p>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {formatINR(surveyReport.salvageValue)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">Recommended Liability</p>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {formatINR((surveyReport.assessmentAmount || 0) - (surveyReport.salvageValue || 0))}
                  </p>
                </div>
              </div>

              <div className="bg-[#F5F7FF] p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Findings & Damage Analysis: </span>
                  <span className="text-slate-600">{surveyReport.findings}</span>
                </div>
                {surveyReport.recommendations && (
                  <div>
                    <span className="font-semibold text-slate-700">Surveyor Recommendation: </span>
                    <span className="text-slate-600">{surveyReport.recommendations}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm text-center py-6 text-slate-400 text-xs">
              No technical survey inspection was required for this claim.
            </div>
          )}

          {/* Uploaded Documents Dossier */}
          <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-navy-700" /> Evidence Dossier ({claim.documents?.length || 0})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {claim.documents && claim.documents.length > 0 ? (
                claim.documents.map((doc) => (
                  <div 
                    key={doc._id} 
                    className="p-3 bg-[#F5F7FF] border border-[#D9E1FA] rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div className="truncate mr-2">
                      <p className="text-xs font-semibold text-navy-900 truncate">{doc.originalName}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{doc.category}</span>
                    </div>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2.5 py-1 bg-white border border-slate-300 text-navy-800 hover:bg-navy-50 rounded text-xs font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 col-span-2">No documents attached.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Rule Engine Verdict & Timeline */}
        <div className="space-y-6">
          {/* Automated Rule Results */}
          <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Rule Engine Validation
            </h2>

            <div className="space-y-2">
              {claim.ruleResults && claim.ruleResults.length > 0 ? (
                claim.ruleResults.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-[#F5F7FF] text-xs flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{r.ruleName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.evidence}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' :
                      r.result === 'FAIL' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {r.result}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Rules pending execution.</p>
              )}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-navy-700" /> Lifecycle Audit Trail
            </h2>
            <TimelineView claimId={claim._id} />
          </div>
        </div>
      </div>

      {/* Decision Action Modal */}
      {actionType && (
        <div className="fixed inset-0 z-50 bg-navy-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-navy-900">
                {actionType === 'APPROVE' && 'Authorize Settlement Disbursement'}
                {actionType === 'REJECT' && 'Reject Insurance Claim'}
                {actionType === 'RETURN' && 'Return File to Officer'}
              </h3>
              <button 
                onClick={() => setActionType(null)} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              {actionType === 'APPROVE' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Approved Settlement Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-navy-900"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Requested: {formatINR(claim.requestedAmount)}
                      {surveyReport && ` | Surveyor Estimate: ${formatINR(surveyReport.assessmentAmount)}`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Settlement Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#D9E1FA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="BANK_TRANSFER">Direct EFT / Bank Transfer</option>
                      <option value="CHECK">Settlement Check</option>
                      <option value="DIGITAL_WALLET">Digital Wallet Disbursement</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Manager Compliance Notes & Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="4"
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={
                    actionType === 'APPROVE' 
                      ? 'Confirm policy coverage limits, surveyor estimates, and disbursement approval grounds...'
                      : actionType === 'REJECT'
                      ? 'State explicit policy exclusion clause or fraudulent finding...'
                      : 'Provide instructions for officer to request missing evidence or correct data...'
                  }
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 border border-[#D9E1FA] rounded-lg text-xs font-semibold text-slate-600 hover:bg-[#F5F7FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-md flex items-center gap-1.5 ${
                    actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' :
                    actionType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-500' :
                    'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {submitting ? 'Recording...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {previewDoc && (
        <DocumentViewer
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

export { ManagerClaimWorkspace };
