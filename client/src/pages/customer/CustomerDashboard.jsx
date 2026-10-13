import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  PlusCircle,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../services/api';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';

export const CustomerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load customer stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <Header
        title="Policyholder Claims Dashboard"
        subtitle="Track active claims, review document requests, and monitor settlement payouts"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/customer/policies/register-external"
              className="px-3 py-1.5 rounded-lg border border-[#D9E1FA] bg-white hover:bg-[#F5F7FF] text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0000FF]" />
              Register External Policy
            </Link>
            <Link
              to="/customer/claims/new"
              className="px-3.5 py-1.5 rounded-lg bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold shadow-md shadow-blue-800/30 glow-electric-hover text-xs tracking-wide flex items-center gap-1.5 transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              File New Claim
            </Link>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Computing live records...</div>
        ) : (
          <>
            {/* Stat Cards Grid (Dynamic MongoDB Counts) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Claims</span>
                <div className="text-2xl font-black text-[#101A38] mt-1">{stats?.totalClaims || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Submitted all-time</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#0000FF] tracking-wider">Under Review</span>
                <div className="text-2xl font-black text-[#0000FF] mt-1">{stats?.awaitingReview || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Verification in progress</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Action Needed</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{stats?.requiringDocs || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Documents requested</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Approved</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{stats?.approvedClaims || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Awaiting / paid</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Settled</span>
                <div className="text-2xl font-black text-[#101A38] mt-1">
                  {formatINR(stats?.totalSettledAmount || 0)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Disbursed to bank</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Active Policies</span>
                <div className="text-2xl font-black text-[#0000FF] mt-1">{stats?.activePolicies || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Platform + External</div>
              </div>
            </div>

            {/* Alert Banner if documents needed */}
            {stats?.requiringDocs > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 text-xs text-amber-900 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Missing Documentation Action Required:</span> You have{' '}
                    <strong>{stats.requiringDocs} claim(s)</strong> awaiting supporting documents requested by your officer.
                  </div>
                </div>
                <Link
                  to="/customer/claims"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex-shrink-0 shadow-xs"
                >
                  View Claims
                </Link>
              </div>
            )}

            {/* Recent Claims Section */}
            <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#101A38]">Recently Updated Claims</h3>
                  <p className="text-xs text-slate-500">Live timeline statuses queried from MongoDB</p>
                </div>
                <Link
                  to="/customer/claims"
                  className="text-xs font-bold text-[#0000FF] hover:text-blue-800 flex items-center gap-1"
                >
                  View All Claims <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {stats?.recentClaims?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No claims submitted yet. Click "File New Claim" to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5F7FF] border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5">Reference</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Policy Number</th>
                        <th className="p-3.5">Incident Date</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats?.recentClaims?.map((claim) => (
                        <tr key={claim._id} className="hover:bg-[#F5F7FF]/60 transition">
                          <td className="p-3.5 font-mono font-bold text-[#101A38]">{claim.claimReference}</td>
                          <td className="p-3.5 font-semibold text-slate-700">{claim.category}</td>
                          <td className="p-3.5 font-mono text-slate-500">{claim.customerPolicy?.policyNumber || 'N/A'}</td>
                          <td className="p-3.5 text-slate-600">
                            {new Date(claim.incidentDate).toISOString().split('T')[0]}
                          </td>
                          <td className="p-3.5 font-bold text-[#101A38]">
                            {formatINR(claim.requestedAmount)}
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={claim.status} />
                          </td>
                          <td className="p-3.5 text-right">
                            <Link
                              to={`/customer/claims/${claim._id}`}
                              className="px-2.5 py-1 rounded-lg border border-[#D9E1FA] text-slate-700 hover:bg-slate-100 font-semibold text-[11px]"
                            >
                              Track
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
