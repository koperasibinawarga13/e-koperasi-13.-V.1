
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const AnggotaLayout: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex bg-light min-h-screen">
       <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileMenuOpen}
        setMobileOpen={setMobileMenuOpen} 
      />
      <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ease-in-out md:${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Outlet context={{ setMobileMenuOpen }} />
      </main>
    </div>
  );
};

export default AnggotaLayout;
