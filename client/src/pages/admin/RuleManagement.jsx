import React, { useState, useEffect } from 'react';
import { 
  Settings, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, 
  ShieldCheck, Info, RefreshCw, Cpu 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function RuleManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rules');
      setRules(res.data.data);
    } catch (err) {
      showToast('Failed to load configurable underwriting rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (rule) => {
    try {
      setTogglingId(rule._id);
      await api.patch(`/rules/${rule._id}/toggle`, {
        isActive: !rule.isActive
      });
      showToast(`Rule ${rule.ruleCode} ${!rule.isActive ? 'activated' : 'deactivated'}`, 'success');
      fetchRules();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle rule state', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Deterministic Underwriting Rules Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Configure automated verification parameters, duplicate submission filters, and surveyor inspection triggers.</p>
        </div>
        <button
          onClick={fetchRules}
          className="px-3 py-1.5 bg-white border border-[#D9E1FA] text-slate-700 hover:bg-[#F5F7FF] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload Policies
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-bold">Automated Evaluation Protocol</p>
          <p className="mt-0.5">
            Rules execute deterministically upon customer claim submission. Flagged results route the file into officer and manager triage workflows without prematurely rejecting the customer without authorized human review.
          </p>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-xl border border-[#D9E1FA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700 mx-auto mb-2"></div>
            Loading rules engine configuration...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F5F7FF]/60 transition-colors">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy-800 bg-slate-100 px-2 py-0.5 rounded">
                      {rule.ruleCode}
                    </span>
                    <h3 className="font-bold text-navy-900 text-sm">{rule.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      rule.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                      rule.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {rule.severity} Severity
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{rule.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    rule.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {rule.isActive ? 'Active Engine' : 'Inactive'}
                  </span>

                  <button
                    onClick={() => handleToggle(rule)}
                    disabled={togglingId === rule._id}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 ${
                      rule.isActive
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {rule.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { RuleManagement };
