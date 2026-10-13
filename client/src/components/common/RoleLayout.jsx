import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const RoleLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF] text-[#101A38]">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto p-6 md:p-8 bg-[#F5F7FF]">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
