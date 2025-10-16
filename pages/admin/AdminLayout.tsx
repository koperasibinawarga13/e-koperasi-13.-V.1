import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const AdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`flex-1 p-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;