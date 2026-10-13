import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}! Logged in as ${user.role}.`, 'success');
      navigate(from || getRoleDashboardPath(user.role), { replace: true });
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-3xl border border-[#D9E1FA] shadow-xl">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0000FF] to-[#090DC2] text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-800/30">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-[#020950] tracking-tight">Sign In to InsureFlow</h1>
            <p className="text-xs text-[#64708A] mt-1">
              Access your role-specific dashboard and claims management queue
            </p>
          </div>

          {import.meta.env.DEV && (
            <div className="p-3 bg-[#F5F7FF] rounded-2xl border border-[#D9E1FA]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64708A] block mb-2 text-center">
                Development Role Quick Fill
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('customer@insureflow.com', 'Customer@123')}
                  className="p-1.5 rounded-xl border border-[#D9E1FA] bg-white hover:bg-[#E8EDFF] font-bold text-[#020950] text-center transition"
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('officer@insureflow.com', 'Officer@123')}
                  className="p-1.5 rounded-xl border border-[#D9E1FA] bg-white hover:bg-[#E8EDFF] font-bold text-[#0000FF] text-center transition"
                >
                  Officer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('surveyor@insureflow.com', 'Surveyor@123')}
                  className="p-1.5 rounded-xl border border-[#D9E1FA] bg-white hover:bg-[#E8EDFF] font-bold text-[#090DC2] text-center transition"
                >
                  Surveyor
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('manager@insureflow.com', 'Manager@123')}
                  className="p-1.5 rounded-xl border border-[#D9E1FA] bg-white hover:bg-[#E8EDFF] font-bold text-[#0B0EA6] text-center transition"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@insureflow.com', 'Admin@123')}
                  className="col-span-2 sm:col-span-1 p-1.5 rounded-xl border border-[#D9E1FA] bg-white hover:bg-[#E8EDFF] font-bold text-[#060A8A] text-center transition"
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#101A38] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64708A] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9E1FA] bg-[#F5F7FF] text-xs text-[#101A38] focus:bg-white focus:outline-hidden focus:border-[#0000FF] focus:ring-1 focus:ring-[#0000FF]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#101A38]">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#0000FF] hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64708A] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9E1FA] bg-[#F5F7FF] text-xs text-[#101A38] focus:bg-white focus:outline-hidden focus:border-[#0000FF] focus:ring-1 focus:ring-[#0000FF]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold text-xs tracking-wide transition shadow-lg shadow-blue-800/30 glow-electric-hover flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#F5F7FF]">
            <span className="text-xs text-[#64708A]">Need a customer account? </span>
            <Link to="/register" className="text-xs font-bold text-[#0000FF] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
