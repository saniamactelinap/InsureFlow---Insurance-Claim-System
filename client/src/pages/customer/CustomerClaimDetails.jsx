import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  DollarSign,
  Calendar,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  Lock,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TimelineView } from '../../components/claim/TimelineView';
import { DocumentViewer } from '../../components/claim/DocumentViewer';

export const CustomerClaimDetails = () => {
  const { id } = useParams();
  const { showToast } = useToast();

  const [claimData, setClaimData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Additional document upload state
  const [newFile, setNewFile] = useState(null);
  const [newDocCategory, setNewDocCategory] = useState('MEDICAL_BILL');
  const [uploading, setUploading] = useState(false);

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/claims/${id}`);
      if (res.data.success) {
        setClaimData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load claim file', err);
      showToast('Error loading claim details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimDetails();
  }, [id]);

  const handleUploadAdditional = async (e) => {
    e.preventDefault();
    if (!newFile) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append('document', newFile);
      data.append('documentCategory', newDocCategory);

      const res = await api.post(`/claims/${id}/documents`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Document uploaded and processed successfully!', 'success');
        setNewFile(null);
        fetchClaimDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">Loading claim file...</div>
    );
  }

  if (!claimData || !claimData.claim) {
    return (
      <div className="p-16 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 text-base">Claim Record Not Found</h3>
        <Link to="/customer/claims" className="text-[#0000FF] text-xs font-semibold underline mt-2 block">
          Return to Claims
        </Link>
      </div>
    );
  }

  const { claim, documents, timelineEvents, settlement } = claimData;
  const isDocumentsRequired = claim.status === 'DOCUMENTS_REQUIRED';

  return (
    <div className="space-y-6">
      <Header
        title={`Claim Tracking: ${claim.claimReference}`}
        subtitle={`Submitted on ${new Date(claim.submittedAt || claim.createdAt).toLocaleDateString()}`}
        actions={
          <Link
            to="/customer/claims"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9E1FA] bg-white hover:bg-[#F5F7FF] text-xs font-semibold text-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Claims
          </Link>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-white rounded-3xl border border-[#D9E1FA] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-[#101A38]">{claim.claimReference}</span>
              <StatusBadge status={claim.status} />
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
              <span>Category: <strong>{claim.category}</strong></span>
              <span>Policy: <strong>{claim.customerPolicy?.policyNumber}</strong> ({claim.policySource})</span>
              <span>Incident: <strong>{new Date(claim.incidentDate).toISOString().split('T')[0]}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested Amount</span>
              <span className="text-xl font-black text-[#101A38]">{formatINR(claim.requestedAmount)}</span>
            </div>

            {claim.approvedAmount > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Approved Settlement</span>
                <span className="text-xl font-black text-emerald-600">{formatINR(claim.approvedAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Required Banner if missing documents */}
        {isDocumentsRequired && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>Officer Action Required: Supporting Documents Requested</span>
            </div>
            {claim.missingDocumentsRequested?.length > 0 && (
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">Requested Document Types:</span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                  {claim.missingDocumentsRequested.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-amber-800 leading-relaxed">
              Please upload the requested proof documents using the form below to resume processing.
            </p>
          </div>
        )}

        {/* Settlement Disbursement Card if Settled/Approved */}
        {settlement && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>Authorized Settlement Voucher: {settlement.settlementReference}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {settlement.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Approved Amount</span>
                <span className="font-black text-lg text-white">{formatINR(settlement.approvedAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Payment Method</span>
                <span className="font-semibold text-slate-200">{settlement.paymentMethod?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Transaction Ref</span>
                <span className="font-mono text-slate-200">{settlement.paymentReference || 'Processing Disbursement'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Authorized Date</span>
                <span className="text-slate-200">{new Date(settlement.authorizedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Split Grid: Details & Documents on Left, Timeline on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Incident Description & Documents */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Details Card */}
            <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#101A38] uppercase tracking-wider">Incident Details</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-[#F5F7FF] p-4 rounded-xl border border-slate-100">
                {claim.incidentDescription}
              </p>
              {claim.incidentLocation && (
                <div className="text-xs text-slate-500">
                  <strong>Location / Facility:</strong> {claim.incidentLocation}
                </div>
              )}
            </div>

            {/* Uploaded Documents List */}
            <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#101A38] uppercase tracking-wider">
                  Uploaded Supporting Documents ({documents?.length || 0})
                </h3>
              </div>

              {documents?.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">No documents attached.</div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <DocumentViewer key={doc._id} document={doc} />
                  ))}
                </div>
              )}

              {/* Upload Additional Document Form */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Upload Additional Document</h4>
                <form onSubmit={handleUploadAdditional} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={newDocCategory}
                      onChange={(e) => setNewDocCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden"
                    >
                      <option value="MEDICAL_BILL">Hospital / Medical Bill</option>
                      <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                      <option value="REPAIR_ESTIMATE">Repair Estimate / Invoice</option>
                      <option value="ACCIDENT_PHOTO">Accident Photo</option>
                      <option value="VEHICLE_RC">Vehicle RC / Registration</option>
                      <option value="OTHER">Other Proof Document</option>
                    </select>

                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setNewFile(e.target.files[0])}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Claim Milestones Audit Timeline */}
          <div>
            <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#101A38] uppercase tracking-wider">
                Claim Progress & Audit Timeline
              </h3>
              <TimelineView events={timelineEvents} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerClaimDetails;
