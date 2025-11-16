import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavBar from '../../components/BottomNavBar';

const AnggotaLayout: React.FC = () => {
  return (
    <div className="bg-background min-h-screen text-dark">
      <div className="relative flex-1">
        <main className="flex-1 p-4 md:p-8 pb-28">
          <Outlet />
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default AnggotaLayout;