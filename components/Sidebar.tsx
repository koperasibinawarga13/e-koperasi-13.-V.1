import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { DashboardIcon, UsersIcon, UploadIcon, ChartBarIcon, LogoutIcon, UserCircleIcon, CreditCardIcon, CogIcon, BuildingOfficeIcon } from './icons/Icons';

interface NavItem {
  to: string;
  label: string;
  // FIX: Changed JSX.Element to React.ReactNode to resolve namespace error.
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
  { to: '/anggota/profil', label: 'Profil', icon: <UserCircleIcon /> },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === UserRole.ADMIN ? adminNavItems : anggotaNavItems;

  const NavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-gray-200 hover:bg-blue-700 rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-blue-700 font-semibold' : ''
    }`;

  return (
    <div className="w-64 bg-primary text-white flex flex-col h-screen p-4 fixed">
      <div className="flex items-center mb-10 px-2">
        <BuildingOfficeIcon />
        <h1 className="text-2xl font-bold ml-3">Binawarga</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.to} className="mb-2">
              <NavLink to={item.to} className={NavLinkClasses}>
                {item.icon}
                <span className="ml-4">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-200 hover:bg-blue-700 rounded-lg transition-colors duration-200"
        >
          <LogoutIcon />
          <span className="ml-4">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
