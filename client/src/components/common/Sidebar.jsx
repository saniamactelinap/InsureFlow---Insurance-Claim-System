import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  FilePlus,
  Files,
  ClipboardList,
  CheckCircle,
  Users,
  Settings2,
  FileSearch,
  Activity,
  DollarSign,
  Building2,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const role = user.role;
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';

  const isLinkActive = (to) => {
    const normalizedTo = to.replace(/\/+$/, '') || '/';
    if (currentPath === normalizedTo) return true;
    if (normalizedTo === '/customer/claims' && currentPath === '/customer/claims/history') {
      return true;
    }
    return false;
  };

  const getLinks = () => {
    switch (role) {
      case 'CUSTOMER':
        return [
          { to: '/customer/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { to: '/customer/policies', label: 'My Policies', icon: ShieldCheck },
          { to: '/customer/policies/register-external', label: 'Register External Policy', icon: Building2 },
          { to: '/customer/claims/new', label: 'Submit New Claim', icon: FilePlus },
          { to: '/customer/claims', label: 'My Claims History', icon: Files },
          { to: '/customer/settlements', label: 'Settlement Payouts', icon: DollarSign },
        ];
      case 'OFFICER':
        return [
          { to: '/officer/dashboard', label: 'Officer Dashboard', icon: LayoutDashboard },
          { to: '/officer/queue', label: 'Claims Work Queue', icon: ClipboardList },
          { to: '/officer/external-policies', label: 'External Policy Review', icon: Building2 },
        ];
      case 'SURVEYOR':
        return [
          { to: '/surveyor/dashboard', label: 'Surveyor Dashboard', icon: LayoutDashboard },
          { to: '/surveyor/inspections', label: 'Inspection Work Queue', icon: CalendarCheck },
        ];
      case 'MANAGER':
        return [
          { to: '/manager/dashboard', label: 'Manager Dashboard', icon: LayoutDashboard },
          { to: '/manager/decisions', label: 'Pending Claim Decisions', icon: CheckCircle },
          { to: '/manager/settlements', label: 'Settlement Authorizations', icon: DollarSign },
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'Staff & User Management', icon: Users },
          { to: '/admin/policies', label: 'Policy Catalog Management', icon: ShieldCheck },
          { to: '/admin/rules', label: 'Automated Rule Engine', icon: Settings2 },
          { to: '/admin/audit-logs', label: 'System Compliance Logs', icon: FileSearch },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-[#020950] border-r border-[#060A8A] text-slate-300 flex flex-col min-h-screen">
      {/* Role Badge Header */}
      <div className="p-5 border-b border-[#060A8A] flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#8FA4E8] uppercase tracking-wider block">
            {role} Portal
          </span>
          <span className="text-sm font-semibold text-white truncate block max-w-[170px]">
            {user.name}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#03096D] text-[#8FA4E8] border border-[#060A8A]">
          v2.4
        </span>
      </div>

      {/* Nav Links */}
      <nav className="p-3 space-y-1.5 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = isLinkActive(link.to);
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              aria-current={isActive ? 'page' : undefined}
              className={() =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#0000FF] text-white font-semibold shadow-md shadow-blue-800/40'
                    : 'text-slate-300 hover:text-white hover:bg-[#03096D]'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-[#060A8A] text-[11px] text-slate-400">
        <div className="flex items-center gap-2 mb-1 text-slate-300 font-medium">
          <Activity className="w-3.5 h-3.5 text-[#0000FF]" />
          <span>Pipeline Status: Active</span>
        </div>
        <div>Connected to Verified Adjudication</div>
      </div>
    </aside>
  );
};
