import React, { useState, useEffect } from 'react';
import { 
  Activity, Search, Filter, Shield, Clock, 
  User, CheckCircle, AlertTriangle, RefreshCw 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.data);
    } catch (err) {
      showToast('Failed to load system audit trail', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l =>
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.entityType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">System Audit & Compliance Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Immutable record of state transitions, underwriting evaluations, and staff decisions.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 bg-white border border-[#D9E1FA] text-slate-700 hover:bg-[#F5F7FF] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E1FA] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-xl border border-[#D9E1FA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700 mx-auto mb-2"></div>
            Loading audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No audit records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F5F7FF] border-b border-[#D9E1FA] text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#F5F7FF]/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-sans font-semibold">
                      {log.user?.name || 'System Event'}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {log.user?.role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-navy-50 text-navy-800 font-bold border border-navy-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">
                      {log.entityType} ({log.entityId?.slice(-6)})
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-sans truncate max-w-xs">
                      {log.details ? JSON.stringify(log.details) : 'Audit state recorded'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export { AuditLogs };
