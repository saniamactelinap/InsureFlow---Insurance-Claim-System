import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { useToast } from '../../context/ToastContext';

export const Contact = () => {
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Your message has been received. Our support team will respond shortly.', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
      <Navbar />

      <div className="bg-[#020950] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-[#060A8A] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold text-[#8FA4E8] uppercase tracking-wider block mb-2">
            Customer Support & Claims Assistance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Contact InsureFlow Support</h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Have questions about a policy, need assistance submitting supporting documents, or tracking an active claim?
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#D9E1FA] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0000FF] flex items-center justify-center mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#101A38] text-sm mb-1">Toll-Free Helpline</h3>
              <p className="text-xs text-slate-500 mb-2">Mon-Fri 8:00 AM - 8:00 PM EST</p>
              <div className="text-sm font-black text-[#101A38]">1-800-INSURE-FLOW</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#D9E1FA] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0000FF] flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#101A38] text-sm mb-1">Email Claims Inquiries</h3>
              <p className="text-xs text-slate-500 mb-2">Typically answered within 4 hours</p>
              <div className="text-sm font-bold text-[#0000FF]">claims-help@insureflow.com</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#D9E1FA] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#101A38] text-sm mb-1">Corporate Headquarters</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                InsureFlow Technologies Inc.<br />
                Suite 4200, Financial District Tower<br />
                Chicago, IL 60601
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-[#D9E1FA] shadow-xs">
            <h2 className="text-lg font-bold text-[#101A38] mb-2">Submit a Support Ticket</h2>
            <p className="text-xs text-slate-500 mb-6">Our dedicated support agents and officers will respond promptly.</p>

            {submitted ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-bold text-emerald-900 text-base">Ticket Submitted Successfully</h3>
                <p className="text-xs text-emerald-700 mt-1 mb-6">
                  Reference #TKT-{Math.floor(100000 + Math.random() * 900000)} has been generated and queued.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-xl bg-[#020950] text-white text-xs font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Topic</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                    placeholder="e.g. Claim CLM-2026-9182 Document Verification"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message Details</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                    placeholder="Describe your question or issue in detail..."
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#020950] hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition shadow-sm flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
