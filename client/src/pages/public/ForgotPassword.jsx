import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const ForgotPassword = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      showToast('Password recovery instructions dispatched.', 'success');
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Recovery</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered email address to receive password reset instructions
            </p>
          </div>

          {sent ? (
            <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-emerald-900 text-sm">Recovery Dispatched</h3>
              <p className="text-xs text-emerald-700 mt-1 mb-4 leading-relaxed">
                If an account exists with <strong>{email}</strong>, a secure password reset link has been dispatched to your inbox.
              </p>
              <Link to="/login" className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition shadow-md disabled:opacity-50"
              >
                {loading ? 'Dispatching...' : 'Send Recovery Instructions'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold">
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
