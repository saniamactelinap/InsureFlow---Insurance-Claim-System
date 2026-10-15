import React, { useState, useEffect } from 'react';
import { 
  Settings, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, 
  ShieldCheck, Info, RefreshCw, Cpu, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function RuleManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/rules');
      const loadedRules = Array.isArray(res.data?.data) ? res.data.data : [];
      setRules(loadedRules);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to load configurable underwriting rules';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (rule) => {
    if (togglingId === rule._id) return;
    const isCurrentlyActive = Boolean(rule.isEnabled ?? rule.isActive);
    const targetState = !isCurrentlyActive;

    try {
      setTogglingId(rule._id);
      
      const res = await api.patch(`/rules/${rule._id}/toggle`, {
        isEnabled: targetState,
        isActive: targetState,
      });

      const updatedRule = res.data?.data;
      setRules((prevRules) =>
        prevRules.map((r) =>
          r._id === rule._id
            ? { ...r, ...(updatedRule || {}), isEnabled: targetState, isActive: targetState }
            : r
        )
      );

      const ruleName = rule.name || rule.ruleId || 'Rule';
      showToast(
        `${ruleName} is now ${targetState ? 'activated' : 'deactivated'}`,
        'success'
      );
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to toggle rule state';
      showToast(errMsg, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Derive counts directly from the actual loaded rule records
  const totalRulesCount = rules.length;
  const activeRulesCount = rules.filter((r) => Boolean(r.isEnabled ?? r.isActive)).length;
  const inactiveRulesCount = totalRulesCount - activeRulesCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Deterministic Underwriting Rules Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure automated verification parameters, duplicate submission filters, and surveyor inspection triggers.
          </p>
        </div>
        <button
          onClick={fetchRules}
          disabled={loading}
          className="px-3 py-1.5 bg-white border border-[#D9E1FA] text-slate-700 hover:bg-[#F5F7FF] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload Policies
        </button>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-bold">Automated Evaluation Protocol</p>
          <p className="mt-0.5">
            Rules execute deterministically upon customer claim submission. Flagged results route the file into officer and manager triage workflows without prematurely rejecting the customer without authorized human review.
          </p>
        </div>
      </div>

      {/* State & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#D9E1FA] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Rules</p>
            <p className="text-2xl font-bold text-navy-900 mt-0.5">{loading ? '-' : totalRulesCount}</p>
            <span className="text-[11px] text-slate-500">Configured in system</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D9E1FA] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Engines</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{loading ? '-' : activeRulesCount}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Enforcing in claims</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D9E1FA] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inactive / Paused</p>
            <p className="text-2xl font-bold text-slate-600 mt-0.5">{loading ? '-' : inactiveRulesCount}</p>
            <span className="text-[11px] text-slate-500">Bypassed during check</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Rules List Container */}
      <div className="bg-white rounded-xl border border-[#D9E1FA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700 mx-auto mb-2"></div>
            Loading rules engine configuration...
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-navy-900">{error}</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Unable to load underwriting rules from the backend. Verify database connectivity and authentication permissions.
            </p>
            <button
              onClick={fetchRules}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Retry Loading Rules
            </button>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Configurable Rules Found</p>
            <p className="text-xs text-slate-500 mt-1">The underwriting rules collection is currently unpopulated.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map((rule) => {
              const isActive = Boolean(rule.isEnabled ?? rule.isActive);
              const ruleCode = rule.ruleId || rule.ruleCode || 'RULE';
              const isPending = togglingId === rule._id;

              const severity = (rule.severity || 'FLAGGED').toUpperCase();
              const severityBadgeClass =
                severity === 'BLOCKING' || severity === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : severity === 'FLAGGED' || severity === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200';

              return (
                <div 
                  key={rule._id} 
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F5F7FF]/60 transition-colors"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-navy-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {ruleCode}
                      </span>
                      <h3 className="font-bold text-navy-900 text-sm">{rule.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${severityBadgeClass}`}>
                        {severity} Severity
                      </span>
                      {rule.category && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {rule.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {isActive ? 'Active Engine' : 'Inactive'}
                    </span>

                    <button
                      onClick={() => handleToggle(rule)}
                      disabled={isPending}
                      className={`min-w-[80px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                        isPending
                          ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-500'
                          : isActive
                          ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      {isPending ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isActive ? (
                        'Disable'
                      ) : (
                        'Enable'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { RuleManagement };
