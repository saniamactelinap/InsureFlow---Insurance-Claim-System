import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Send,
  Building2,
  Calendar,
  Clock,
  Eye,
  ShieldAlert,
  HelpCircle,
  Edit3,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TimelineView } from '../../components/claim/TimelineView';
import { DocumentViewer } from '../../components/claim/DocumentViewer';
import { OCRComparisonModal } from '../../components/claim/OCRComparisonModal';
import { Modal } from '../../components/common/Modal';

export const OfficerClaimWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [claimData, setClaimData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surveyors, setSurveyors] = useState([]);

  // Modal States
  const [selectedOcrJob, setSelectedOcrJob] = useState(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isSurveyorModalOpen, setIsSurveyorModalOpen] = useState(false);
  const [isRequestDocsModalOpen, setIsRequestDocsModalOpen] = useState(false);
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);

  // Action Form States
  const [surveyorId, setSurveyorId] = useState('');
  const [surveyorInstructions, setSurveyorInstructions] = useState('');
  const [missingDocsInput, setMissingDocsInput] = useState('');
  const [recommendation, setRecommendation] = useState('APPROVE');
  const [recommendedAmount, setRecommendedAmount] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/claims/${id}`);
      if (res.data.success) {
        setClaimData(res.data.data);
        setRecommendedAmount(res.data.data.claim?.requestedAmount || '');
      }
    } catch (err) {
      console.error('Failed to load claim', err);
      showToast('Error loading claim file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveyors = async () => {
    try {
      const res = await api.get('/users?role=SURVEYOR');
      if (res.data.success) {
        setSurveyors(res.data.data);
        if (res.data.data.length > 0) setSurveyorId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load surveyors', err);
    }
  };

  useEffect(() => {
    fetchClaimDetails();
    fetchSurveyors();
  }, [id]);

  // ACTION 1: Assign Surveyor
  const handleAssignSurveyor = async (e) => {
    e.preventDefault();
    if (!surveyorId) {
      showToast('Please select a surveyor.', 'error');
      return;
    }
    try {
      setSubmittingAction(true);
      const res = await api.post('/survey/assign', {
        claimId: id,
        surveyorId,
        instructions: surveyorInstructions,
      });
      if (res.data.success) {
        showToast('Surveyor assigned and task queued for inspection.', 'success');
        setIsSurveyorModalOpen(false);
        fetchClaimDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign surveyor', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // ACTION 2: Request Additional Documents
  const handleRequestDocs = async (e) => {
    e.preventDefault();
    const docList = missingDocsInput.split(',').map((d) => d.trim()).filter(Boolean);
    if (docList.length === 0) {
      showToast('Please specify at least one required document type.', 'error');
      return;
    }
    try {
      setSubmittingAction(true);
      const res = await api.post(`/claims/${id}/request-documents`, {
        requestedDocuments: docList,
        officerNotes,
      });
      if (res.data.success) {
        showToast('Notification dispatched to policyholder for additional documents.', 'success');
        setIsRequestDocsModalOpen(false);
        fetchClaimDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request documents', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // ACTION 3: Recommend Claim & Escalate to Manager
  const handleRecommend = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const res = await api.post(`/claims/${id}/recommend`, {
        recommendation,
        officerNotes,
        recommendedAmount: Number(recommendedAmount),
      });
      if (res.data.success) {
        showToast(`Claim escalated to Manager decision workspace with recommendation: ${recommendation}`, 'success');
        setIsRecommendModalOpen(false);
        fetchClaimDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit recommendation', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">Loading adjudication file...</div>
    );
  }

  if (!claimData || !claimData.claim) {
    return (
      <div className="p-16 text-center">
        <h3 className="font-bold text-slate-800 text-base">Claim Record Not Found</h3>
        <Link to="/officer/queue" className="text-[#0000FF] text-xs font-semibold underline mt-2 block">
          Return to Work Queue
        </Link>
      </div>
    );
  }

  const { claim, documents, timelineEvents, surveyReports } = claimData;
  const policy = claim.customerPolicy;
  const rules = claim.automatedValidation?.rules || [];

  return (
    <div className="space-y-6">
      <Header
        title={`Adjudication File: ${claim.claimReference}`}
        subtitle={`Policyholder: ${claim.customer?.name} (${claim.customer?.email}) | Incident: ${new Date(claim.incidentDate).toISOString().split('T')[0]}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRequestDocsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-[#D9E1FA] bg-white hover:bg-[#F5F7FF] text-slate-700 text-xs font-semibold transition"
            >
              Request Documents
            </button>
            <button
              onClick={() => setIsSurveyorModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition"
            >
              Assign Surveyor
            </button>
            <button
              onClick={() => setIsRecommendModalOpen(true)}
              className="px-4 py-1.5 rounded-lg bg-[#0000FF] hover:bg-[#0000D0] text-white text-xs font-bold transition shadow-xs"
            >
              Escalate to Manager
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Claim Summary */}
          <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Claim Summary</span>
              <StatusBadge status={claim.status} />
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Requested Amount:</span>
              <span className="font-black text-[#101A38] text-sm">{formatINR(claim.requestedAmount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Category / Type:</span>
              <span className="font-semibold text-slate-800">{claim.category} ({claim.claimType})</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Incident Date:</span>
              <span className="font-mono text-slate-800">{new Date(claim.incidentDate).toISOString().split('T')[0]}</span>
            </div>
          </div>

          {/* Policy Information */}
          <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Policy Particulars</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {claim.policySource}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Insurer:</span>
              <span className="font-semibold text-[#101A38]">{policy?.insurerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Policy Number:</span>
              <span className="font-mono font-bold text-[#101A38]">{policy?.policyNumber}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Coverage Window:</span>
              <span className="font-mono text-slate-700 text-[11px]">
                {policy ? `${new Date(policy.startDate).toISOString().split('T')[0]} to ${new Date(policy.endDate).toISOString().split('T')[0]}` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Automated Rule Health */}
          <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Rule Engine Status</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  claim.automatedValidation?.status === 'PASS'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : claim.automatedValidation?.status === 'FAIL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {claim.automatedValidation?.status || 'PENDING'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Validation Score:</span>
              <span className="font-black text-[#101A38] text-sm">{claim.automatedValidation?.score || 0}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Duplicate Check:</span>
              <span className={`font-semibold ${claim.isDuplicateWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
                {claim.isDuplicateWarning ? 'Potential Duplicate Flagged' : 'Passed Clear'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Surveyor Required:</span>
              <span className="font-semibold text-slate-800">
                {claim.isHighValueClaim ? 'Yes (Amount >= ₹5,000)' : 'Standard Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Deterministic Rule Engine Detailed Audit Breakdown */}
        <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#101A38] uppercase tracking-wider">
                Automated Deterministic Rule Evaluations ({rules.length})
              </h3>
              <p className="text-xs text-slate-500">Server evaluated deterministic checks with explanation and evidence</p>
            </div>
            <span className="text-xs text-slate-400">
              Evaluated: {new Date(claim.automatedValidation?.evaluatedAt || claim.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {rules.map((r, i) => {
              const isPass = r.status === 'PASS';
              const isFail = r.status === 'FAIL';
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    isPass
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : isFail
                      ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                      : 'bg-amber-50/40 border-amber-200 text-amber-950'
                  }`}
                >
                  {isPass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : isFail ? (
                    <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-[#101A38]">{r.name}</span>
                      <span className="text-[10px] font-bold uppercase">{r.status}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{r.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents & OCR Inspection Section */}
        <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#101A38] uppercase tracking-wider">
              Supporting Proof Documents & Intelligent OCR Extraction ({documents?.length || 0})
            </h3>
            <p className="text-xs text-slate-500">
              Inspect uploaded bills and certificates. Click "Inspect OCR Entities" to compare recognized fields or apply audited corrections.
            </p>
          </div>

          <div className="space-y-4">
            {documents?.map((doc) => {
              const ocrJob = doc.ocrJob;
              return (
                <div key={doc._id} className="border border-[#D9E1FA] rounded-2xl p-4 bg-[#F5F7FF]/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0000FF]" />
                      <span className="font-bold text-xs text-[#101A38]">{doc.originalName}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        {doc.documentCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ocrJob && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOcrJob(ocrJob);
                            setIsOcrModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#0000FF]" />
                          Inspect OCR Entities ({ocrJob.confidenceScore}%)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Document Preview */}
                  <DocumentViewer document={doc} />

                  {/* Summary of OCR extracted values */}
                  {ocrJob && (
                    <div className="p-3 rounded-xl bg-white border border-[#D9E1FA] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Detected Amount</span>
                        <span className="font-bold text-[#101A38]">
                          {formatINR(ocrJob.extractedFields?.detectedAmount || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Detected Date</span>
                        <span className="font-semibold text-slate-800">
                          {ocrJob.extractedFields?.detectedDate || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Invoice / Bill #</span>
                        <span className="font-mono text-slate-800">
                          {ocrJob.extractedFields?.invoiceOrBillNumber || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Issuer / Facility</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {ocrJob.extractedFields?.issuerName || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Surveyor Reports Section if present */}
        {surveyReports && surveyReports.length > 0 && (
          <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              Certified Surveyor Inspection Report
            </h3>
            {surveyReports.map((report) => (
              <div key={report._id} className="p-4 rounded-xl bg-purple-50/40 border border-purple-100 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#101A38]">Surveyor: {report.surveyor?.name}</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    Recommended Settlement: {formatINR(report.recommendedSettlementAmount)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 border-y border-purple-100">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Estimated Repair Cost:</span>
                    <span className="font-bold text-slate-800">{formatINR(report.estimatedRepairCost)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Liability Assessment:</span>
                    <span className="font-semibold text-purple-700">{report.liabilityAssessment}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Inspection Date:</span>
                    <span className="text-slate-700">{new Date(report.inspectionDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Findings:</strong> {report.detailedFindings}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Audit Timeline */}
        <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#101A38] uppercase tracking-wider">
            Chronological Audit Timeline
          </h3>
          <TimelineView events={timelineEvents} />
        </div>
      </div>

      {/* MODAL 1: OCR ENTITY INSPECTION & AUDITED CORRECTION */}
      {isOcrModalOpen && selectedOcrJob && (
        <OCRComparisonModal
          isOpen={isOcrModalOpen}
          onClose={() => setIsOcrModalOpen(false)}
          ocrJob={selectedOcrJob}
          claim={claim}
          onUpdated={fetchClaimDetails}
        />
      )}

      {/* MODAL 2: ASSIGN SURVEYOR */}
      <Modal
        isOpen={isSurveyorModalOpen}
        onClose={() => setIsSurveyorModalOpen(false)}
        title="Assign Technical Surveyor for Field Inspection"
      >
        <form onSubmit={handleAssignSurveyor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Certified Surveyor</label>
            <select
              value={surveyorId}
              onChange={(e) => setSurveyorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              required
            >
              {surveyors.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.email}) - {s.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Instructions</label>
            <textarea
              rows={3}
              value={surveyorInstructions}
              onChange={(e) => setSurveyorInstructions(e.target.value)}
              placeholder="e.g. Verify vehicular damage to bumper and undercarriage; verify salvage estimate."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSurveyorModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#D9E1FA] text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs"
            >
              {submittingAction ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: REQUEST ADDITIONAL DOCUMENTS */}
      <Modal
        isOpen={isRequestDocsModalOpen}
        onClose={() => setIsRequestDocsModalOpen(false)}
        title="Request Missing Supporting Documents"
      >
        <form onSubmit={handleRequestDocs} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Documents (Comma-separated)
            </label>
            <input
              type="text"
              required
              value={missingDocsInput}
              onChange={(e) => setMissingDocsInput(e.target.value)}
              placeholder="e.g. Hospital Discharge Summary, Original Itemized Bill, Police FIR"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions to Customer</label>
            <textarea
              rows={3}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="Explain to the policyholder why these documents are required for policy validation..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRequestDocsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#D9E1FA] text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
            >
              {submittingAction ? 'Dispatching...' : 'Request Documents'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: RECOMMEND & ESCALATE TO MANAGER */}
      <Modal
        isOpen={isRecommendModalOpen}
        onClose={() => setIsRecommendModalOpen(false)}
        title="Escalate Claim to Claims Operations Manager"
      >
        <form onSubmit={handleRecommend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Recommendation</label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
            >
              <option value="APPROVE">Recommend Approval</option>
              <option value="REJECT">Recommend Rejection</option>
              <option value="ESCALATE">Escalate for Senior Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recommended Settlement Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={recommendedAmount}
              onChange={(e) => setRecommendedAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Adjudication Notes</label>
            <textarea
              rows={3}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="Summarize document verification findings, OCR alignment, and deductible calculation..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecommendModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#D9E1FA] text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="px-4 py-1.5 rounded-lg bg-[#0000FF] hover:bg-[#0000D0] text-white text-xs font-bold shadow-xs"
            >
              {submittingAction ? 'Escalating...' : 'Submit to Manager'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OfficerClaimWorkspace;
