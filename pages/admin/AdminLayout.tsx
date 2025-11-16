import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { MenuIcon } from '../../components/icons/Icons';

const AdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="bg-background min-h-screen">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="relative flex-1">
        {/* Hamburger Button for Mobile */}
        <button 
          onClick={() => setMobileMenuOpen(true)} 
          className="md:hidden fixed top-4 left-4 z-20 p-2 bg-surface/80 backdrop-blur-sm rounded-full text-dark shadow-lg border border-slate-200"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ease-in-out ml-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;