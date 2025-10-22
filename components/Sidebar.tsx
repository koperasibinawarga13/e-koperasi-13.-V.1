import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { DashboardIcon, UsersIcon, UploadIcon, ChartBarIcon, LogoutIcon, UserCircleIcon, CreditCardIcon, BuildingOfficeIcon, ChevronLeftIcon, CalculatorIcon, MegaphoneIcon } from './icons/Icons';
import { LogoBinaWarga } from './icons/LogoBinaWarga';

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
  { to: '/admin/pinjaman', label: 'Pengajuan Pinjaman', icon: <CreditCardIcon /> },
  { to: '/admin/pengumuman', label: 'Pengumuman', icon: <MegaphoneIcon /> },
];

const anggotaNavItems: NavItem[] = [
  { to: '/anggota/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/anggota/keuangan', label: 'Keuangan', icon: <CreditCardIcon /> },
  { to: '/anggota/pinjaman', label: 'Pengajuan Pinjaman', icon: <CalculatorIcon /> },
  { to: '/anggota/profil', label: 'Profil', icon: <UserCircleIcon /> },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, isMobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === UserRole.ADMIN ? adminNavItems : anggotaNavItems;

  const NavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center w-full text-gray-300 hover:bg-primary/40 rounded-lg transition-colors duration-200 relative ${
      isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'
    } ${
      isActive ? 'bg-primary font-semibold text-white' : ''
    }`;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      ></div>
      
      <div 
        className={`bg-dark text-white flex flex-col h-screen fixed z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isCollapsed ? 'w-20 p-2' : 'w-64 p-4'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={toggleSidebar}
          className={`absolute top-16 -right-3 transform bg-primary hover:bg-primary-dark text-white w-7 h-7 rounded-full items-center justify-center focus:outline-none ring-2 ring-white shadow-lg z-10 hidden md:flex`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className={`flex items-center justify-center mb-10 transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-16 px-2'}`}>
            <div className={`w-full transition-all duration-300 ${isCollapsed ? 'max-w-[40px]' : 'max-w-[160px]'}`}>
                <LogoBinaWarga className="text-white"/>
            </div>
        </div>

        <nav className="flex-grow">
          <ul>
            {navItems.map((item) => (
              <li key={item.to} className="mb-2 group relative">
                <NavLink to={item.to} className={NavLinkClasses} onClick={onMobileClose}>
                    <>
                      <div className="flex-shrink-0">{item.icon}</div>
                      <span className={`ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{item.label}</span>
                    </>
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

        <div className="group relative border-t border-white/10 pt-2">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full text-gray-300 hover:bg-primary/40 rounded-lg transition-colors duration-200 ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'}`}
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
    </>
  );
};

export default Sidebar;