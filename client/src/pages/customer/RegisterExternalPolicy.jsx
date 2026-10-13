import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, UploadCloud, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';

export const RegisterExternalPolicy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    insurerName: '',
    policyNumber: '',
    category: 'HEALTH',
    policyholderName: user?.name || '',
    coverageAmount: '',
    deductible: '0',
    startDate: '',
    endDate: '',
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.insurerName || !form.policyNumber || !form.coverageAmount || !form.startDate || !form.endDate) {
      showToast('Please fill out all mandatory policy fields.', 'error');
      return;
    }

    if (new Date(form.startDate) >= new Date(form.endDate)) {
      showToast('Policy end date must be after start date.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('insurerName', form.insurerName);
      data.append('policyNumber', form.policyNumber);
      data.append('category', form.category);
      data.append('policyholderName', form.policyholderName);
      data.append('coverageAmount', form.coverageAmount);
      data.append('deductible', form.deductible || '0');
      data.append('startDate', form.startDate);
      data.append('endDate', form.endDate);

      if (file) {
        data.append('policyDocument', file);
      }

      const res = await api.post('/customer-policies/register-external', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('External insurance policy registered and queued for verification.', 'success');
        navigate('/customer/policies');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to register external policy.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Register External Insurance Policy"
        subtitle="Bring your existing policies from external insurance carriers to file claims on InsureFlow"
        actions={
          <Link
            to="/customer/policies"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9E1FA] bg-white hover:bg-[#F5F7FF] text-xs font-semibold text-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> My Policies
          </Link>
        }
      />

      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-[#D9E1FA] p-8 shadow-xs">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#101A38]">External Provider Information</h2>
              <p className="text-xs text-slate-500">Provide official details as listed on your insurer's certificate or policy schedule</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Insurance Carrier / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.insurerName}
                  onChange={(e) => setForm({ ...form, insurerName: e.target.value })}
                  placeholder="e.g. Allianz, Metropolitan General, BlueCross"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Number / Certificate Ref <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.policyNumber}
                  onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
                  placeholder="e.g. POL-ALLZ-998124"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Insurance Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="HEALTH">Health & Medical Protection</option>
                  <option value="VEHICLE">Vehicle & Auto Indemnity</option>
                  <option value="PROPERTY">Property & Real Estate Insurance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Named Policyholder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.policyholderName}
                  onChange={(e) => setForm({ ...form, policyholderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Coverage Limit ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={form.coverageAmount}
                  onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })}
                  placeholder="e.g. 50000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deductible (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.deductible}
                  onChange={(e) => setForm({ ...form, deductible: e.target.value })}
                  placeholder="e.g. 250"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Inception / Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Expiration / End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            {/* Document Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Policy Certificate / Schedule (PDF, JPG, PNG)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-6 text-center cursor-pointer transition bg-[#F5F7FF]">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                  id="policy-doc-input"
                />
                <label htmlFor="policy-doc-input" className="cursor-pointer">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  {file ? (
                    <div className="text-xs font-bold text-[#0000FF]">{file.name} ({(file.size / 1024).toFixed(0)} KB)</div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-slate-700">Click to upload policy document</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF or scanned photographs up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0000FF] flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Verification Transparency:</strong> Once registered, external policies enter a <em>Verification Pending</em> state while an officer audits the schedule and document details. You can file claims immediately; claims will be formally disbursed once verified.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                to="/customer/policies"
                className="px-4 py-2.5 rounded-xl border border-[#D9E1FA] text-slate-700 text-xs font-semibold hover:bg-[#F5F7FF] transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Registering Policy...' : 'Register & Save Policy'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterExternalPolicy;
