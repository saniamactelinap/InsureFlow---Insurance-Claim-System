import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Building2,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import api from '../../services/api';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';

export const OfficerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load officer dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <Header
        title="Insurance Verification Officer Workspace"
        subtitle="Manage assigned claims, audit OCR entity extractions, and evaluate policy compliance"
        actions={
          <Link
            to="/officer/queue"
            className="px-3.5 py-1.5 rounded-lg bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold text-xs tracking-wide flex items-center gap-1.5 transition shadow-xs"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Full Claims Queue
          </Link>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">Computing officer pipeline statistics...</div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#0000FF] tracking-wider">My Active Queue</span>
                <div className="text-2xl font-black text-[#101A38] mt-1">{stats?.assignedQueue || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Assigned to my profile</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unassigned New</span>
                <div className="text-2xl font-black text-[#101A38] mt-1">{stats?.newUnassigned || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Submitted claims awaiting pickup</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Docs Requested</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{stats?.requiringDocs || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Awaiting customer response</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">OCR / Rule Flags</span>
                <div className="text-2xl font-black text-rose-600 mt-1">{stats?.ocrFlagged || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Entity or eligibility mismatch</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Manager Review</span>
                <div className="text-2xl font-black text-purple-600 mt-1">{stats?.escalatedToManager || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Escalated for final decision</div>
              </div>
            </div>

            {/* Work Queue Table */}
            <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#101A38]">Recent Claims Requiring Review</h3>
                  <p className="text-xs text-slate-500">Live work queue records across all categories</p>
                </div>
                <Link
                  to="/officer/queue"
                  className="text-xs font-bold text-[#0000FF] hover:text-blue-800 flex items-center gap-1"
                >
                  View All in Work Queue <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F7FF] border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Source</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Validation</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recentClaims?.map((claim) => (
                      <tr key={claim._id} className="hover:bg-[#F5F7FF]/70 transition">
                        <td className="p-4 font-mono font-bold text-[#101A38]">{claim.claimReference}</td>
                        <td className="p-4">
                          <div className="font-semibold text-[#101A38]">{claim.customer?.name}</div>
                          <div className="text-[10px] text-slate-400">{claim.customer?.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{claim.category}</td>
                        <td className="p-4 font-mono text-[11px] text-slate-500">{claim.policySource}</td>
                        <td className="p-4 font-bold text-[#101A38]">{formatINR(claim.requestedAmount)}</td>
                        <td className="p-4">
                          <StatusBadge status={claim.status} />
                        </td>
                        <td className="p-4">
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
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            to={`/officer/claims/${claim._id}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition inline-flex items-center gap-1"
                          >
                            Adjudicate
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;
