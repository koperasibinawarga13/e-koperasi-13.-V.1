import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { DashboardIcon, UsersIcon, UploadIcon, ChartBarIcon, LogoutIcon, UserCircleIcon, CreditCardIcon, BuildingOfficeIcon, ChevronLeftIcon, CalculatorIcon } from './icons/Icons';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/admin/anggota', label: 'Data Anggota', icon: <UsersIcon /> },
  { to: '/admin/upload', label: 'Upload Data', icon: <UploadIcon /> },
  { to: '/admin/laporan', label: 'Laporan', icon: <ChartBarIcon /> },
];

const anggotaNavItems: NavItem[] = [
  { to: '/anggota/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/anggota/keuangan', label: 'Keuangan', icon: <CreditCardIcon /> },
  { to: '/anggota/pinjaman', label: 'Pinjaman', icon: <CalculatorIcon /> },
  { to: '/anggota/profil', label: 'Profil', icon: <UserCircleIcon /> },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === UserRole.ADMIN ? adminNavItems : anggotaNavItems;

  const NavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center w-full text-gray-200 hover:bg-blue-700 rounded-lg transition-colors duration-200 ${
      isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'
    } ${
      isActive ? 'bg-blue-700 font-semibold' : ''
    }`;

  return (
    <div className={`bg-primary text-white flex flex-col h-screen fixed transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 p-2' : 'w-64 p-4'}`}>
      <button
        onClick={toggleSidebar}
        className="absolute top-16 -right-3 transform bg-primary hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center focus:outline-none ring-2 ring-white shadow-lg z-10"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`flex items-center mb-10 ${isCollapsed ? 'justify-center h-12' : 'px-2 h-12'}`}>
        <BuildingOfficeIcon className="w-8 h-8 flex-shrink-0" />
        <div className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="text-xl font-bold leading-tight">e-Koperasi 13</h1>
            <p className="text-xs text-blue-200 leading-tight">Bina Warga</p>
        </div>
      </div>

      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.to} className="mb-2 group relative">
              <NavLink to={item.to} className={NavLinkClasses}>
                <div className="flex-shrink-0">{item.icon}</div>
                <span className={`ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{item.label}</span>
              </NavLink>
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-dark text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-20">
                  {item.label}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="group relative border-t border-blue-800 pt-2">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full text-gray-200 hover:bg-blue-700 rounded-lg transition-colors duration-200 ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'}`}
        >
          <div className="flex-shrink-0"><LogoutIcon /></div>
          <span className={`ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Logout</span>
        </button>
        {isCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-dark text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-20">
            Logout
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;