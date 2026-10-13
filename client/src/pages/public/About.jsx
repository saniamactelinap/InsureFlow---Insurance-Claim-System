import React from 'react';
import { Shield, Users, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
      <Navbar />

      <div className="bg-[#020950] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-[#060A8A] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold text-[#8FA4E8] uppercase tracking-wider block mb-2">
            Mission & Philosophy
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Transparent, Human-in-the-Loop Insurance Automation
          </h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Eliminating delay, reducing manual paperwork errors, and restoring trust between policyholders and insurance providers.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full space-y-12">
        <div className="bg-white rounded-3xl border border-[#D9E1FA] p-8 sm:p-10 shadow-xs">
          <h2 className="text-xl font-bold text-[#101A38] mb-4">The InsureFlow Principle</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
            Traditional insurance processing suffers from fragmented workflows: documents languish in physical queues, data extraction from scanned bills is error-prone, and customers remain in the dark about their claim status for weeks.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            InsureFlow bridges this divide by coupling deterministic computer validation with authorized human oversight. Optical Character Recognition (OCR) digests raw receipts into structured data; automated rule algorithms check policy boundaries in milliseconds; but final financial approvals remain strictly in the hands of authenticated managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0000FF] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#101A38] text-sm mb-2">Zero Blind Automation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No claim is automatically rejected by an algorithm or OCR error. Flawed extractions are flagged for human correction with an immutable audit trail.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0000FF] flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#101A38] text-sm mb-2">Five Dedicated Roles</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict separation of concerns between Policyholders, Verification Officers, Certified Surveyors, Operations Managers, and System Administrators.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#101A38] text-sm mb-2">Multi-Insurer Support</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Accepts policies from external insurance carriers alongside platform policies, parsing certificates and coordinating claims seamlessly.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
