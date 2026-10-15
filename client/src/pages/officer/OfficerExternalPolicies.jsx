import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, XCircle, Search, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';

export const OfficerExternalPolicies = () => {
  const { showToast } = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Verify Modal
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [verificationAction, setVerificationAction] = useState('VERIFIED');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer-policies?source=EXTERNAL');
      if (res.data.success) {
        setPolicies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load external policies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPolicy) return;

    try {
      setSubmitting(true);
      const res = await api.patch(`/customer-policies/${selectedPolicy._id}/verify-external`, {
        status: verificationAction,
        notes: verificationNotes,
      });

      if (res.data.success) {
        showToast(`Policy marked as ${verificationAction} successfully.`, 'success');
        setSelectedPolicy(null);
        setVerificationNotes('');
        fetchPolicies();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = policies.filter((p) => {
    const matchesSearch =
      p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.insurerName.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Header
        title="External Third-Party Policy Verification"
        subtitle="Audit policy schedules submitted from outside insurance providers before approving claims"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by policy # or customer..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#D9E1FA] text-xs focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D9E1FA] text-xs bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All States</option>
              <option value="PENDING">Verification Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Policies Table */}
        <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading external policies...</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No external policies match the criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7FF] border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Policy #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Carrier / Insurer</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Coverage</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Document</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((pol) => (
                    <tr key={pol._id} className="hover:bg-[#F5F7FF]/70 transition">
                      <td className="p-4 font-mono font-bold text-[#101A38]">{pol.policyNumber}</td>
                      <td className="p-4">
                        <div className="font-semibold text-[#101A38]">{pol.customer?.name}</div>
                        <div className="text-[10px] text-slate-400">{pol.customer?.email}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{pol.insurerName}</td>
                      <td className="p-4 font-semibold text-slate-700">{pol.category}</td>
                      <td className="p-4 font-bold text-[#101A38]">{formatINR(pol.coverageAmount)}</td>
                      <td className="p-4 text-slate-500 text-[11px] font-mono">
                        {new Date(pol.startDate).toISOString().split('T')[0]} to{' '}
                        {new Date(pol.endDate).toISOString().split('T')[0]}
                      </td>
                      <td className="p-4">
                        {pol.policyDocumentUrl ? (
                          <a
                            href={pol.policyDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0000FF] hover:text-blue-800 font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" /> View Doc
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None attached</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            pol.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : pol.verificationStatus === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {pol.verificationStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPolicy(pol);
                            setVerificationAction(pol.verificationStatus === 'VERIFIED' ? 'REJECTED' : 'VERIFIED');
                          }}
                          className="px-3 py-1 rounded-lg border border-[#D9E1FA] text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
                        >
                          Audit & Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Verify Modal */}
      {selectedPolicy && (
        <Modal
          isOpen={!!selectedPolicy}
          onClose={() => setSelectedPolicy(null)}
          title={`External Policy Audit: #${selectedPolicy.policyNumber}`}
        >
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="p-3 bg-[#F5F7FF] rounded-xl border border-[#D9E1FA] text-xs space-y-1">
              <div>
                <span className="text-slate-500">Carrier:</span> <strong>{selectedPolicy.insurerName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Customer:</span> <strong>{selectedPolicy.customer?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Coverage:</span> <strong>{formatINR(selectedPolicy.coverageAmount)}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Verification Action</label>
              <select
                value={verificationAction}
                onChange={(e) => setVerificationAction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
              >
                <option value="VERIFIED">VERIFIED (Authenticate and Allow Payouts)</option>
                <option value="REJECTED">REJECTED (Invalid or Incomplete Policy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Audit Notes</label>
              <textarea
                rows={3}
                required
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="State verified certificate details or reason for rejection..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPolicy(null)}
                className="px-3 py-1.5 rounded-lg border border-[#D9E1FA] text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
              >
                {submitting ? 'Updating...' : 'Save Audit Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OfficerExternalPolicies;
