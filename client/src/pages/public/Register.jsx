import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      showToast('Account created successfully! Welcome to your customer portal.', 'success');
      navigate('/customer/dashboard');
    } catch (err) {
      showToast(err.message || 'Registration failed. Email may already be in use.', 'error');
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-black text-[#020950] tracking-tight">Create Customer Account</h1>
            <p className="text-xs text-[#64708A] mt-1">
              Apply for policies, submit claims, and track settlements in real time
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#101A38] mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64708A] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9E1FA] bg-[#F5F7FF] text-xs text-[#101A38] focus:bg-white focus:outline-hidden focus:border-[#0000FF] focus:ring-1 focus:ring-[#0000FF]"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101A38] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64708A] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9E1FA] bg-[#F5F7FF] text-xs text-[#101A38] focus:bg-white focus:outline-hidden focus:border-[#0000FF] focus:ring-1 focus:ring-[#0000FF]"
                  placeholder="sarah@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101A38] mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#64708A] absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9E1FA] bg-[#F5F7FF] text-xs text-[#101A38] focus:bg-white focus:outline-hidden focus:border-[#0000FF] focus:ring-1 focus:ring-[#0000FF]"
                  placeholder="+1 (555) 019-5510"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101A38] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64708A] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9E1FA] bg-[#F5F7FF] text-xs text-[#101A38] focus:bg-white focus:outline-hidden focus:border-[#0000FF] focus:ring-1 focus:ring-[#0000FF]"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101A38] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64708A] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9E1FA] bg-[#F5F7FF] text-xs text-[#101A38] focus:bg-white focus:outline-hidden focus:border-[#0000FF] focus:ring-1 focus:ring-[#0000FF]"
                  placeholder="Repeat your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold text-xs tracking-wide transition shadow-lg shadow-blue-800/30 glow-electric-hover flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#F5F7FF]">
            <span className="text-xs text-[#64708A]">Already have an account? </span>
            <Link to="/login" className="text-xs font-bold text-[#0000FF] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
