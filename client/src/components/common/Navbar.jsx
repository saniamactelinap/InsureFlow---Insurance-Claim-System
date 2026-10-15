import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Logo } from './Logo';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardPath = user ? getRoleDashboardPath(user.role) : '/';

  const navLinks = [
    { label: 'Home', targetId: 'hero', path: '/' },
    { label: 'About', targetId: 'about', path: '/about' },
    { label: 'Explore Insurance', targetId: 'explore-insurance', path: '/policies' },
    { label: 'Coverage Lines', targetId: 'categories', path: '/#categories' },
    { label: 'How Claims Work', targetId: 'how-it-works', path: '/how-it-works' },
    { label: 'FAQ', targetId: 'faq', path: '/faq' },
  ];

  const handleNavClick = (e, item) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(item.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate(item.path);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#020950]/95 backdrop-blur-md border-b border-[#060A8A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo variant="icon" theme="dark" size="md" to="/" />

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-300">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={location.pathname === '/' ? `#${link.targetId}` : link.path}
              onClick={(e) => handleNavClick(e, link)}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#03096D] transition duration-150 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#03096D] relative transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#D9E1FA] py-2 text-[#101A38] z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2.5 border-b border-[#E8EDFF] flex items-center justify-between">
                      <span className="font-bold text-sm text-[#020950]">Notifications</span>
                      <span className="text-xs text-[#64708A]">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#F5F7FF]">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#64708A]">No notifications yet.</div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => {
                              markAsRead(n._id);
                              if (n.link) navigate(n.link);
                              setShowNotifications(false);
                            }}
                            className={`p-3.5 text-xs hover:bg-[#F5F7FF] cursor-pointer transition ${
                              !n.isRead ? 'bg-[#E8EDFF]/50 font-medium' : ''
                            }`}
                          >
                            <div className="text-[#020950] font-semibold mb-0.5">{n.title}</div>
                            <div className="text-[#64708A] line-clamp-2 leading-relaxed">{n.message}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dashboard Action Button */}
              <Link
                to={dashboardPath}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-semibold text-xs tracking-wide transition shadow-md shadow-blue-700/30"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {user.role} Portal
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-[#03096D] hover:bg-[#060A8A] text-slate-200 text-xs font-medium transition border border-[#060A8A]"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#0000FF] text-white flex items-center justify-center font-bold text-[10px]">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <span className="hidden lg:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#D9E1FA] py-1.5 text-[#101A38] z-50 text-xs font-medium">
                    <div className="px-3.5 py-2.5 border-b border-[#E8EDFF]">
                      <div className="font-bold text-[#020950] truncate">{user.name}</div>
                      <div className="text-[11px] text-[#64708A] truncate">{user.email}</div>
                      <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-[#E8EDFF] text-[10px] font-bold text-[#090DC2]">
                        {user.role}
                      </div>
                    </div>
                    <Link
                      to={dashboardPath}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3.5 py-2 hover:bg-[#F5F7FF] text-[#101A38]"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#060A8A]" />
                      Portal Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#03096D] transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold transition shadow-md shadow-blue-700/30 glow-electric-hover"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
