import React, { useState, useEffect } from 'react';
import { 
  loadReportsFromStorage, 
  saveOrUpdateReport, 
  submitReportByOperator, 
  resetReportsToDemo, 
  getReportById,
  deleteReport,
  clearAllReportsToZero
} from './services/reportStorage';
import { createNewBlankReport } from './services/mockReports';
import { CncDailyReport } from './types';
import { HeaderNav } from './components/HeaderNav';
import { OperatorForm } from './components/OperatorForm';
import { TrackingDashboard } from './components/TrackingDashboard';
import { ApprovalView } from './components/ApprovalView';
import { PhysicalFormPrint } from './components/PhysicalFormPrint';
import { ApprovalShareModal } from './components/ApprovalShareModal';
import { UserCheck, ShieldCheck, User, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState<CncDailyReport[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'approval' | 'print'>('dashboard');
  const [activeReport, setActiveReport] = useState<CncDailyReport | null>(null);
  const [approvalRole, setApprovalRole] = useState<'supervisor' | 'gm'>('supervisor');
  const [shareModalReport, setShareModalReport] = useState<CncDailyReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load initial reports
  useEffect(() => {
    const loaded = loadReportsFromStorage();
    setReports(loaded);
    if (loaded.length > 0 && !activeReport) {
      setActiveReport(loaded[0]);
    }
  }, []);

  // Check URL hash for direct approval links (#approval?token=... or #approval?id=...&role=...)
  useEffect(() => {
    const checkHashRoute = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#approval')) {
        const queryStr = hash.split('?')[1];
        if (queryStr) {
          const params = new URLSearchParams(queryStr);
          const token = params.get('token');
          const role = (params.get('role') as 'supervisor' | 'gm') || 'supervisor';
          const reportId = params.get('id');

          const allReports = loadReportsFromStorage();
          let target = allReports.find((r) => r.id === reportId);
          if (!target && token) {
            target = allReports.find((r) => r.supervisorToken === token || r.gmToken === token);
          }

          if (target) {
            setActiveReport(target);
            setApprovalRole(role);
            setCurrentView('approval');
          }
        }
      }
    };

    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);
    return () => window.removeEventListener('hashchange', checkHashRoute);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Actions
  const handleNewReport = () => {
    const fresh = createNewBlankReport('');
    setActiveReport(fresh);
    setCurrentView('form');
  };

  const handleSaveDraft = (report: CncDailyReport) => {
    saveOrUpdateReport(report);
    const updatedList = loadReportsFromStorage();
    setReports(updatedList);
    setActiveReport(report);
    showToast('Draft laporan berhasil disimpan!');
  };

  const handleSubmitReport = (report: CncDailyReport) => {
    const submitted = submitReportByOperator(report);
    const updatedList = loadReportsFromStorage();
    setReports(updatedList);
    setActiveReport(submitted);
    // Open share modal immediately so user sees generated unique link
    setShareModalReport(submitted);
    showToast('Laporan berhasil diajukan ke Supervisor (Mulyana)! Tautan persetujuan telah diterbitkan.');
  };

  const handleUpdateReportFromApproval = (updated: CncDailyReport) => {
    const updatedList = loadReportsFromStorage();
    setReports(updatedList);
    setActiveReport(updated);
  };

  const handleResetData = () => {
    if (confirm('Reset seluruh data ke data simulasi pabrik awal?')) {
      const resetList = resetReportsToDemo();
      setReports(resetList);
      setActiveReport(resetList[0]);
      setCurrentView('dashboard');
      showToast('Data demo berhasil di-reset.');
    }
  };

  const handleDeleteReport = (id: string) => {
    deleteReport(id);
    const updated = loadReportsFromStorage();
    setReports(updated);
    if (activeReport?.id === id) {
      setActiveReport(updated[0] || null);
    }
    showToast(`Laporan ${id} telah dihapus.`);
  };

  const handleClearAllReports = () => {
    clearAllReportsToZero();
    setReports([]);
    setActiveReport(null);
    showToast('Seluruh riwayat laporan telah berhasil dihapus hingga 0 (nol).');
  };

  const handleOpenApproval = (reportId: string, role: 'supervisor' | 'gm') => {
    const target = getReportById(reportId);
    if (target) {
      setActiveReport(target);
      setApprovalRole(role);
      setCurrentView('approval');
      // Update hash for link bookmarking
      window.location.hash = `approval?id=${reportId}&role=${role}`;
    }
  };

  const handleNavigatePrint = (report: CncDailyReport) => {
    setActiveReport(report);
    setCurrentView('print');
  };

  // Stats calculation
  const stats = {
    total: reports.length,
    pendingSupervisor: reports.filter((r) => r.status === 'PENDING_SUPERVISOR').length,
    pendingGm: reports.filter((r) => r.status === 'PENDING_GM').length,
    approved: reports.filter((r) => r.status === 'APPROVED').length,
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      {currentView !== 'print' && (
        <HeaderNav
          currentView={currentView}
          onNavigate={(v) => {
            setCurrentView(v);
            if (v === 'dashboard') {
              window.location.hash = '';
            }
          }}
          onNewReport={handleNewReport}
          onResetData={handleResetData}
          stats={stats}
        />
      )}

      {/* Simulation Helper Strip (No Print) */}
      {currentView !== 'print' && (
        <div className="bg-slate-800/90 text-white py-2 px-4 text-xs border-b border-slate-700 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-blue-400">Mode Simulasi Pengujian:</span>
              <span>Uji alur persetujuan bertingkat dengan 1 klik:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  if (!activeReport) handleNewReport();
                  else setCurrentView('form');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition ${
                  currentView === 'form' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <User className="w-3 h-3" />
                <span>1. Operator Form</span>
              </button>

              <button
                onClick={() => {
                  const target = reports.find((r) => r.status === 'PENDING_SUPERVISOR') || activeReport || reports[0];
                  if (target) {
                    handleOpenApproval(target.id, 'supervisor');
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition ${
                  currentView === 'approval' && approvalRole === 'supervisor'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-700 hover:bg-slate-600 text-amber-300'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>2. Review SPV (Mulyana)</span>
              </button>

              <button
                onClick={() => {
                  const target = reports.find((r) => r.status === 'PENDING_GM') || activeReport || reports[0];
                  if (target) {
                    handleOpenApproval(target.id, 'gm');
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition ${
                  currentView === 'approval' && approvalRole === 'gm'
                    ? 'bg-purple-700 text-white font-bold'
                    : 'bg-slate-700 hover:bg-slate-600 text-purple-300'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>3. Review GM (Arifin)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'dashboard' && (
          <TrackingDashboard
            reports={reports}
            onSelectReport={(r) => {
              setActiveReport(r);
              setCurrentView('form');
            }}
            onEditReport={(r) => {
              setActiveReport(r);
              setCurrentView('form');
            }}
            onOpenApproval={handleOpenApproval}
            onNavigatePrint={handleNavigatePrint}
            onOpenShareModal={(r) => setShareModalReport(r)}
            onNewReport={handleNewReport}
            onDeleteReport={handleDeleteReport}
            onClearAllReports={handleClearAllReports}
            onResetData={handleResetData}
          />
        )}

        {currentView === 'form' && activeReport && (
          <OperatorForm
            report={activeReport}
            onSaveDraft={handleSaveDraft}
            onSubmitReport={handleSubmitReport}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'approval' && activeReport && (
          <ApprovalView
            report={activeReport}
            role={approvalRole}
            onUpdateReport={handleUpdateReportFromApproval}
            onNavigateDashboard={() => {
              window.location.hash = '';
              setCurrentView('dashboard');
            }}
            onNavigatePrint={handleNavigatePrint}
            onOpenShareModal={(r) => setShareModalReport(r)}
          />
        )}

        {currentView === 'print' && activeReport && (
          <PhysicalFormPrint
            report={activeReport}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Share / Unique Link Modal */}
      {shareModalReport && (
        <ApprovalShareModal
          report={shareModalReport}
          isOpen={!!shareModalReport}
          onClose={() => setShareModalReport(null)}
          onOpenApproval={(id, role) => {
            setShareModalReport(null);
            handleOpenApproval(id, role);
          }}
        />
      )}
    </div>
  );
}
