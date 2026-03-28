import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface SidebarProps {
  activeTab: string;
}

export function Sidebar({ activeTab }: SidebarProps) {
  const { user, logout } = useAuth();

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';
  const isReceptionist = user?.role === 'receptionist';

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-green-900 dark:bg-slate-950 flex flex-col h-full py-6 shadow-2xl">
      {!isAdmin && (
        <div className="px-6 mb-10">
          <Link to="/" className="text-2xl font-black text-white dark:text-green-400 tracking-tight font-headline">CHARS</Link>
        </div>
      )}
      <nav className="flex-1 space-y-1">
        {/* Receptionist Section */}
        {isReceptionist && (
          <>
            <Link
              to="/dashboard"
              className={`${activeTab === 'dashboard' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </Link>
            <Link
              to="/assignment"
              className={`${activeTab === 'assignment' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
            >
              <span className="material-symbols-outlined">medical_services</span>
              Doctor Assignment
            </Link>
          </>
        )}

        {/* Universal Section (Visible to Receptionists) */}
        {isReceptionist && (
          <Link
            to="/patients"
            className={`${activeTab === 'patients' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
          >
            <span className="material-symbols-outlined">group</span>
            Patients
          </Link>
        )}

        {/* Doctor Section */}
        {isDoctor && (
          <>
            <Link
              to="/doctor"
              className={`${activeTab === 'doctor-dashboard' || activeTab === 'doctor' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
            >
              <span className="material-symbols-outlined">stethoscope</span>
              Doctor Dashboard
            </Link>
            <Link
              to="/records"
              className={`${activeTab === 'records' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
            >
              <span className="material-symbols-outlined">description</span>
              Patient Records
            </Link>
            <Link
              to="/lab"
              className={`${activeTab === 'lab' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
            >
              <span className="material-symbols-outlined">biotech</span>
              Lab Results
            </Link>
          </>
        )}

        {/* IT & Admin Sections */}
        {isAdmin && (
          <>
            <Link
              to="/admin"
              className={`${activeTab === 'admin-dashboard' || activeTab === 'admin' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              IT Dashboard
            </Link>
            <Link
              to="/admin/users"
              className={`${activeTab === 'users' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
            >
              <span className="material-symbols-outlined">manage_accounts</span>
              User Management
            </Link>
            <Link
              to="/admin/logs"
              className={`${activeTab === 'logs' ? 'bg-green-800 text-green-200' : 'text-green-100/70 hover:bg-green-800/50'} rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80`}
            >
              <span className="material-symbols-outlined">history_edu</span>
              System Logs
            </Link>
          </>
        )}
      </nav>
      {/* Action Button - Visible to Receptionist */}
      {isReceptionist && (
        <div className="px-4 mb-6">
          <Link to="/intake" className="w-full bg-primary-fixed text-on-primary-fixed py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
            <span className="material-symbols-outlined">person_add</span>
            Register Patient
          </Link>
        </div>
      )}
      <div className="pt-6 border-t border-green-800/50">
        {!isAdmin && (
          <Link
            to="/settings"
            className="text-green-100/70 hover:bg-green-800/50 rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80"
          >
            <span className="material-symbols-outlined">settings</span>
            Settings
          </Link>
        )}
        <Link
          to="/login"
          onClick={() => logout()}
          className="text-green-100/70 hover:bg-green-800/50 rounded-lg mx-2 px-4 py-3 flex items-center gap-3 font-manrope text-sm font-medium hover:translate-x-1 transition-transform active:opacity-80"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </Link>
      </div>
    </aside>
  );
}

export function TopBar({ title, userRole, userName }: { title?: string, userRole?: string, userName?: string }) {
  const { user } = useAuth();
  const displayName = userName || (user?.email ? user.email.split('@')[0] : 'User');
  const displayRole = userRole || (user?.role ? user.role.toUpperCase() : 'USER');
  return (
    <header className="fixed top-0 right-0 left-64 z-30 flex justify-between items-center px-8 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm dark:shadow-none font-manrope antialiased">
      <div className="flex items-center gap-6">
        {title ? (
          <h2 className="text-xl font-bold tracking-tight text-green-900">{title}</h2>
        ) : (
          <div className="relative w-80 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all text-sm placeholder:text-slate-500" placeholder="Search patients or records..." type="text" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-bold text-green-900">{displayName}</p>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider">{displayRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 ring-2 ring-white shadow-sm overflow-hidden">
            <span className="material-symbols-outlined text-2xl">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Layout({ children, activeTab, title, userRole, userName }: { children: React.ReactNode, activeTab: string, title?: string, userRole?: string, userName?: string }) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar activeTab={activeTab} />
      <main className="ml-64 min-h-screen">
        <TopBar title={title} userRole={userRole} userName={userName} />
        <div className="pt-24 px-10 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
