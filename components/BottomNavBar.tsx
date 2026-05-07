import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardIcon, CreditCardIcon, CalculatorIcon, UserCircleIcon, LogoutIcon } from './icons/Icons';

const navItems = [
  { to: '/anggota/dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6 mb-1" /> },
  { to: '/anggota/keuangan', label: 'Keuangan', icon: <CreditCardIcon className="w-6 h-6 mb-1" /> },
  { to: '/anggota/pinjaman', label: 'Pinjaman', icon: <CalculatorIcon className="w-6 h-6 mb-1" /> },
  { to: '/anggota/profil', label: 'Profil', icon: <UserCircleIcon className="w-6 h-6 mb-1" /> },
];

const BottomNavBar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center text-center w-full pt-1.5 pb-1 transition-colors duration-200 ${
      isActive ? 'text-primary' : 'text-gray-text hover:text-primary'
    }`;
    
  const LogoutButtonClasses = `flex flex-col items-center justify-center text-center w-full pt-1.5 pb-1 transition-colors duration-200 text-gray-text hover:text-primary`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-zinc-800 z-50">
      <div className="flex justify-around max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={NavLinkClasses}>
            {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5 mb-1' })}
            <span className="text-[11px] font-medium">{item.label}</span>
          </NavLink>
        ))}
        <button onClick={handleLogout} className={LogoutButtonClasses}>
            <LogoutIcon className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;