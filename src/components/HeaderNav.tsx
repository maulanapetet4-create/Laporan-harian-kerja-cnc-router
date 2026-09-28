import React from 'react';
import { 
  FileText, 
  Layers, 
  UserCheck, 
  RotateCcw, 
  Printer, 
  PlusCircle, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ReportStatus } from '../types';
import { LabtechLogo } from './LabtechLogo';

interface HeaderNavProps {
  currentView: 'form' | 'dashboard' | 'approval' | 'print';
  onNavigate: (view: 'form' | 'dashboard' | 'approval' | 'print') => void;
  onNewReport: () => void;
  onResetData: () => void;
  stats?: {
    total: number;
    pendingSupervisor: number;
    pendingGm: number;
    approved: number;
  };
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onNavigate,
  onNewReport,
  onResetData,
  stats,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md no-print sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="bg-white p-1 rounded-xl shadow-xs border border-slate-700/60 flex items-center justify-center">
              <LabtechLogo size="sm" showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg leading-tight tracking-wide text-slate-100">
                  Laporan Harian Mesin CNC
                </h1>
                <span className="text-[10px] uppercase font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded">
                  PT Labtech Indonesia
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Divisi CNC Router • Formulir Presisi & Alur Persetujuan Bertingkat (Operator ➔ SPV ➔ GM)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard & Riwayat</span>
              {stats && stats.total > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-700 rounded-full">
                  {stats.total}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNewReport();
                onNavigate('form');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'form'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Input Form Operator</span>
            </button>
          </nav>

          {/* Quick Action Badges & Reset */}
          <div className="flex items-center gap-2">
            {stats && (
              <div className="hidden lg:flex items-center gap-2 mr-2 text-xs">
                <span 
                  onClick={() => onNavigate('dashboard')} 
                  className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  title="Menunggu persetujuan Supervisor (Mulyana)"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>SPV: {stats.pendingSupervisor}</span>
                </span>
                <span 
                  onClick={() => onNavigate('dashboard')} 
                  className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  title="Menunggu persetujuan GM (Arifin)"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>GM: {stats.pendingGm}</span>
                </span>
                <span 
                  onClick={() => onNavigate('dashboard')} 
                  className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  title="Laporan Selesai Disetujui"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesai: {stats.approved}</span>
                </span>
              </div>
            )}

            <button
              onClick={onResetData}
              title="Reset data ke contoh bawaan pabrik"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Mobile Submenu */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded font-medium ${
              currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            Dashboard ({stats?.total || 0})
          </button>
          <button
            onClick={() => {
              onNewReport();
              onNavigate('form');
            }}
            className={`px-3 py-1.5 rounded font-medium ${
              currentView === 'form' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            + Form Baru
          </button>
        </div>
      </div>
    </header>
  );
};
