import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from '../common/ToastContainer';
import { DevToggle } from '../common/DevToggle';

export const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
      <DevToggle />
    </div>
  );
};
