import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = ({ title, subtitle, actions }) => {
  return (
    <div className="bg-white border border-[#D9E1FA] rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#020950] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-[#64708A] mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <Link
          to="/"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9E1FA] text-xs font-semibold text-[#060A8A] hover:bg-[#F5F7FF] transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Public Site
        </Link>
      </div>
    </div>
  );
};
