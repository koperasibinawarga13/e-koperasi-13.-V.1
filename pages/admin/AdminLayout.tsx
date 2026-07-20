import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { MenuIcon } from '../../components/icons/Icons';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { getMaintenanceMode, setMaintenanceMode } from '../../services/pengaturanService';

const AdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const { user } = useAuth();
  const [isMaintModalOpen, setMaintModalOpen] = useState(false);
  const [maintEnabled, setMaintEnabled] = useState(false);
  const [maintMessage, setMaintMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await getMaintenanceMode();
        if (mounted) {
          setMaintEnabled(m.enabled);
          setMaintMessage(m.message || '');
        }
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSaveMaintenance = async () => {
    try {
      await setMaintenanceMode(maintEnabled, maintMessage);
      setMaintModalOpen(false);
      alert('Pengaturan maintenance berhasil disimpan.');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan maintenance.');
    }
  };

  return (
    <div className="bg-background min-h-screen text-dark">
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
          className="md:hidden fixed top-4 left-4 z-20 p-2 bg-surface/80 backdrop-blur-sm rounded-full text-dark"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <main className={`flex-1 p-3 sm:p-4 md:p-8 transition-all duration-300 ease-in-out ml-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          {user?.role === 'admin' && (
            <div className="fixed top-4 right-4 z-30">
              <button
                onClick={() => setMaintModalOpen(true)}
                className="bg-yellow-500 text-black px-3 py-2 rounded-lg shadow-lg font-semibold"
                title="Toggle Maintenance Mode"
              >
                Maintenance
              </button>
            </div>
          )}

          <Outlet />

          <Modal isOpen={isMaintModalOpen} onClose={() => setMaintModalOpen(false)} title="Maintenance Mode">
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input type="checkbox" checked={maintEnabled} onChange={(e) => setMaintEnabled(e.target.checked)} />
                <span>Aktifkan maintenance</span>
              </label>
              <label className="block text-sm mb-2">Pesan (opsional)</label>
              <input value={maintMessage} onChange={(e) => setMaintMessage(e.target.value)} className="w-full p-2 rounded bg-zinc-800 text-white mb-4" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setMaintModalOpen(false)} className="bg-zinc-700 px-4 py-2 rounded">Batal</button>
                <button onClick={handleSaveMaintenance} className="bg-green-600 px-4 py-2 rounded text-white">Simpan</button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;