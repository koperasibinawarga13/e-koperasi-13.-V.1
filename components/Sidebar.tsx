import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { DashboardIcon, UsersIcon, UploadIcon, ChartBarIcon, LogoutIcon, UserCircleIcon, CreditCardIcon, ChevronLeftIcon, CalculatorIcon, MegaphoneIcon, CashIcon, CogIcon, ClockIcon, ClipboardDocumentListIcon, ChevronDownIcon, ReceiptPercentIcon } from './icons/Icons';
import { Logo } from './icons/Logo';

interface NavItem {
  to?: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const baseAdminNavItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/admin/profil', label: 'Profil Admin', icon: <UserCircleIcon /> },
  { to: '/admin/anggota', label: 'Data Anggota', icon: <UsersIcon /> },
  { to: '/admin/upload', label: 'Upload Data', icon: <UploadIcon /> },
  { 
    label: 'Transaksi', 
    icon: <ReceiptPercentIcon />,
    children: [
      { to: '/admin/transaksi', label: 'Input Transaksi', icon: <CashIcon className="w-5 h-5"/> },
      { to: '/admin/riwayat-transaksi', label: 'Riwayat Transaksi', icon: <ClockIcon className="w-5 h-5"/> },
      { to: '/admin/rekap-transaksi', label: 'Rekap Transaksi Manual', icon: <ClipboardDocumentListIcon className="w-5 h-5"/> },
    ]
  },
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
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  useEffect(() => {
    // Automatically open submenu if the current path is one of its children
    const activeParent = baseAdminNavItems.find(item => 
      item.children?.some(child => location.pathname.startsWith(child.to || ''))
    );
    if (activeParent) {
      setOpenSubMenu(activeParent.label);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (user?.role === UserRole.ADMIN) {
        let adminNavs = [...baseAdminNavItems];
        if (user.email === 'admin@koperasi13.com') {
            adminNavs.push({ 
              label: 'Pengaturan', 
              icon: <CogIcon />,
              children: [
                { to: '/admin/pengaturan-admin', label: 'Akun Admin', icon: <UsersIcon className="w-5 h-5"/> },
                { to: '/admin/pengaturan-kewajiban', label: 'Kewajiban Anggota', icon: <CreditCardIcon className="w-5 h-5"/> },
                { to: '/admin/pengaturan-pinjaman', label: 'Suku Bunga Pinjaman', icon: <ReceiptPercentIcon className="w-5 h-5"/> }
              ]
            });
        }
        return adminNavs;
    }
    return anggotaNavItems;
  };

  const navItems = getNavItems();
  
  const handleSubMenuToggle = (label: string) => {
    setOpenSubMenu(openSubMenu === label ? null : label);
  }

  const isChildActive = (children?: NavItem[]) => {
    return children?.some(child => location.pathname.startsWith(child.to || '')) || false;
  }

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
        className={`bg-sidebar text-dark flex flex-col h-screen fixed z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isCollapsed ? 'w-20 p-2' : 'w-64 p-4'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={toggleSidebar}
          className={`absolute top-16 -right-3 transform bg-primary hover:bg-primary-dark text-black w-7 h-7 rounded-full items-center justify-center focus:outline-none ring-2 ring-black z-10 hidden md:flex`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className={`flex items-center justify-center mb-10 transition-all duration-300 text-dark ${isCollapsed ? 'h-12' : 'h-16 px-2'}`}>
            <Logo className="h-full w-auto object-contain" />
        </div>

        <nav className="flex-grow">
          <ul>
            {navItems.map((item) => (
              <li key={item.label} className="mb-2 group relative">
                {item.children ? (
                  <>
                    <button 
                      onClick={() => handleSubMenuToggle(item.label)}
                      className={`flex items-center justify-between w-full text-gray-text hover:bg-primary-light hover:text-primary rounded-lg transition-colors duration-200 ${
                        isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'
                      } ${isChildActive(item.children) ? 'bg-primary-light text-primary font-semibold' : ''}`}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">{item.icon}</div>
                        <span className={`ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{item.label}</span>
                      </div>
                      {!isCollapsed && <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${openSubMenu === item.label ? 'rotate-180' : ''}`} />}
                    </button>
                    {!isCollapsed && openSubMenu === item.label && (
                      <ul className="pl-8 pt-2 space-y-2">
                        {item.children.map(child => (
                           <li key={child.to}>
                            <NavLink to={child.to!} className={({isActive}) => `flex items-center gap-3 text-sm text-gray-400 hover:text-dark ${isActive ? 'font-bold text-primary' : ''}`}>
                              {child.icon}
                              <span>{child.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink to={item.to!} className={({isActive}) =>
                    `flex items-center w-full text-gray-text hover:bg-primary-light hover:text-primary rounded-lg transition-colors duration-200 relative ${
                      isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'
                    } ${
                      isActive ? 'bg-primary font-semibold text-black' : ''
                    }`
                  } onClick={onMobileClose}>
                      <div className="flex-shrink-0">{item.icon}</div>
                      <span className={`ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{item.label}</span>
                  </NavLink>
                )}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-20">
                    {item.label}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="group relative border-t border-zinc-800 pt-2">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full text-gray-text hover:bg-primary-light hover:text-primary rounded-lg transition-colors duration-200 ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'}`}
          >
            <div className="flex-shrink-0"><LogoutIcon /></div>
            <span className={`ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Logout</span>
          </button>
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-20">
              Logout
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;