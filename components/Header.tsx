
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon, MenuIcon } from './icons/Icons';

interface HeaderProps {
  title: string;
}

interface OutletContextType {
    setMobileMenuOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();
  const context = useOutletContext<OutletContextType | undefined>();
  const setMobileMenuOpen = context?.setMobileMenuOpen;

  return (
    <header className="bg-white shadow-sm p-4 md:p-6 rounded-lg mb-6 md:mb-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
            {/* Hamburger menu button for mobile */}
            {setMobileMenuOpen && (
                 <button 
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden mr-3 text-dark p-1"
                    aria-label="Open sidebar"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-dark truncate">{title}</h1>
        </div>
        <div className="flex items-center space-x-3 text-gray-600">
          <UserCircleIcon className="w-8 h-8 text-gray-400" />
          <span className="font-medium hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
