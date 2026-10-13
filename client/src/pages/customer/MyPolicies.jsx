import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Plus, Building2, ShoppingBag, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';

export const MyPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await api.get('/customer-policies/my');
        if (res.data.success) {
          setPolicies(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load customer policies', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  return (
    <div className="space-y-6">
      <Header
        title="My Insurance Policies"
        subtitle="Active platform insurance policies and registered external third-party coverage"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/policies"
              className="px-3 py-1.5 rounded-lg border border-[#D9E1FA] bg-white hover:bg-[#F5F7FF] text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#0000FF]" />
              Browse Catalog
            </Link>
            <Link
              to="/customer/policies/register-external"
              className="px-3.5 py-1.5 rounded-lg bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold shadow-md shadow-blue-800/30 glow-electric-hover text-xs tracking-wide flex items-center gap-1.5 transition shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              Register External Policy
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading customer policies...</div>
        ) : policies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#D9E1FA] p-12 text-center max-w-md mx-auto">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-[#101A38] text-base">No Policies on Record</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              You do not have any active insurance policies linked to this account yet.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <Link
                to="/policies"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs transition"
              >
                Apply for Platform Policy
              </Link>
              <Link
                to="/customer/policies/register-external"
                className="px-4 py-2 rounded-xl border border-[#D9E1FA] bg-white hover:bg-[#F5F7FF] text-slate-700 font-semibold text-xs transition"
              >
                Register External Policy
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((policy) => {
              const isExternal = policy.policySource === 'EXTERNAL';
              const isVerified = policy.verificationStatus === 'VERIFIED';

              return (
                <div
                  key={policy._id}
                  className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {policy.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            isExternal
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {policy.policySource}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-2.5 h-2.5" /> Verification Pending
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium mb-0.5">{policy.insurerName}</div>
                    <h3 className="font-mono font-bold text-[#101A38] text-sm mb-3">
                      #{policy.policyNumber}
                    </h3>

                    {/* Specs Table */}
                    <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Coverage Limit:</span>
                        <span className="font-bold text-[#101A38]">{formatINR(policy.coverageAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Deductible:</span>
                        <span className="font-semibold text-slate-800">{formatINR(policy.deductible)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Validity:</span>
                        <span className="text-slate-600 font-mono text-[11px]">
                          {new Date(policy.startDate).toISOString().split('T')[0]} to{' '}
                          {new Date(policy.endDate).toISOString().split('T')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-2">
                    <Link
                      to={`/customer/claims/new?policyId=${policy._id}`}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      File Claim on this Policy
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPolicies;
