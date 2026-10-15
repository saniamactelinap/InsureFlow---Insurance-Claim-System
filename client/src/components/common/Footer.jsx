import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, PhoneCall, CheckCircle } from 'lucide-react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="bg-[#020950] border-t border-[#060A8A] text-slate-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <Logo variant="icon" theme="dark" size="md" to="/" />
            <p className="text-slate-400 leading-relaxed text-xs">
              Smart Insurance Claim Processing and Settlement Management System. Delivering connected coverage, transparent automated validation, and verified human review at every critical adjudication milestone.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-[#0000FF]" />
              <span>TLS 1.3 256-bit AES encryption standard</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Insurance Categories</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <Link to="/policies?category=HEALTH" className="hover:text-white transition">Health & Medical Protection</Link>
              </li>
              <li>
                <Link to="/policies?category=VEHICLE" className="hover:text-white transition">Comprehensive Vehicle & Fleet</Link>
              </li>
              <li>
                <Link to="/policies?category=PROPERTY" className="hover:text-white transition">Residential Property & Real Estate</Link>
              </li>
              <li>
                <Link to="/policies" className="hover:text-white transition">All Published Insurance Plans</Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition">Side-by-Side Plan Comparison</Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Platform Portals</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <Link to="/customer/dashboard" className="hover:text-white transition">Policyholder Portal</Link>
              </li>
              <li>
                <Link to="/officer/dashboard" className="hover:text-white transition">Verification Officer Queue</Link>
              </li>
              <li>
                <Link to="/surveyor/dashboard" className="hover:text-white transition">Surveyor Field Inspection</Link>
              </li>
              <li>
                <Link to="/manager/dashboard" className="hover:text-white transition">Claims Manager Decision Hub</Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition">System Administration</Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Help & Information</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <Link to="/how-it-works" className="hover:text-white transition">Claims Lifecycle Guide</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition">Frequently Asked Questions</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">About InsureFlow</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">Customer Support Desk</Link>
              </li>
            </ul>
            <div className="mt-4 p-3.5 rounded-xl bg-[#03096D] border border-[#060A8A] text-[11px] leading-relaxed text-slate-200">
              <PhoneCall className="w-3.5 h-3.5 text-[#0000FF] inline mr-1.5" />
              Claims Assistance: <strong className="text-white">1-800-INSURE-FLOW</strong>
            </div>
          </div>
        </div>

        <div className="border-t border-[#060A8A] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} InsureFlow Platform Systems. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#0000FF]" /> Verified Adjudication</span>
            <span>Deterministic Rules v2.4</span>
            <span>Tesseract OCR Core</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
