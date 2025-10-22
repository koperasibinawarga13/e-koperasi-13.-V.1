import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, CreditCardIcon, CalculatorIcon, UserCircleIcon } from './icons/Icons';

const navItems = [
  { to: '/anggota/dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6 mb-1" /> },
  { to: '/anggota/keuangan', label: 'Keuangan', icon: <CreditCardIcon className="w-6 h-6 mb-1" /> },
  { to: '/anggota/pinjaman', label: 'Pinjaman', icon: <CalculatorIcon className="w-6 h-6 mb-1" /> },
  { to: '/anggota/profil', label: 'Profil', icon: <UserCircleIcon className="w-6 h-6 mb-1" /> },
];

const BottomNavBar: React.FC = () => {
  const NavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center text-center w-full pt-2 pb-1 transition-colors duration-200 ${
      isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={NavLinkClasses}>
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;