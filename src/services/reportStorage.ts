import { CncDailyReport, ReportStatus, ApprovalStep } from '../types';
import { INITIAL_REPORTS } from './mockReports';

const STORAGE_KEY = 'cnc_daily_reports_db_v1';

export const loadReportsFromStorage = (): CncDailyReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (err) {
    console.error('Error loading reports from storage:', err);
    return [];
  }
};

export const saveReportsToStorage = (reports: CncDailyReport[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Error saving reports to storage:', err);
  }
};

export const getReportById = (id: string): CncDailyReport | undefined => {
  const reports = loadReportsFromStorage();
  return reports.find((r) => r.id === id);
};

export const getReportByToken = (token: string): { report: CncDailyReport; role: 'SUPERVISOR' | 'GM' } | null => {
  const reports = loadReportsFromStorage();
  for (const report of reports) {
    if (report.supervisorToken === token) {
      return { report, role: 'SUPERVISOR' };
    }
    if (report.gmToken === token) {
      return { report, role: 'GM' };
    }
  }
  return null;
};

export const saveOrUpdateReport = (report: CncDailyReport): void => {
  const reports = loadReportsFromStorage();
  const index = reports.findIndex((r) => r.id === report.id);
  const now = new Date().toISOString();
  const updatedReport = {
    ...report,
    updatedAt: now,
  };

  if (index >= 0) {
    reports[index] = updatedReport;
  } else {
    reports.unshift(updatedReport);
  }
  saveReportsToStorage(reports);
};

export const submitReportByOperator = (report: CncDailyReport): CncDailyReport => {
  const now = new Date().toISOString();
  const timelineItem: ApprovalStep = {
    role: 'OPERATOR',
    actorName: report.operatorName || 'Operator',
    action: 'SUBMITTED',
    fromStatus: report.status || 'DRAFT',
    toStatus: 'PENDING_SUPERVISOR',
    timestamp: now,
    note: `Laporan diajukan untuk SPK ${report.sasaNo} (${report.project})`,
  };

  const updated: CncDailyReport = {
    ...report,
    status: 'PENDING_SUPERVISOR',
    updatedAt: now,
    timeline: [
      ...(report.timeline || []).filter((t) => t.action !== 'SUBMITTED'),
      timelineItem,
    ],
  };

  saveOrUpdateReport(updated);
  return updated;
};

export const processSupervisorApproval = (
  reportId: string,
  decision: 'APPROVED' | 'REJECTED',
  notes: string,
  approverName = 'Mulyana'
): CncDailyReport => {
  const reports = loadReportsFromStorage();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Laporan tidak ditemukan');

  const now = new Date().toISOString();
  const newStatus: ReportStatus = decision === 'APPROVED' ? 'PENDING_GM' : 'REJECTED';

  const timelineItem: ApprovalStep = {
    role: 'SUPERVISOR',
    actorName: approverName,
    action: decision,
    fromStatus: report.status,
    toStatus: newStatus,
    timestamp: now,
    note: notes || (decision === 'APPROVED' ? 'Disetujui oleh Supervisor' : 'Ditolak untuk revisi'),
  };

  const updated: CncDailyReport = {
    ...report,
    status: newStatus,
    updatedAt: now,
    supervisorApproval: {
      approvedAt: now,
      approverName,
      notes,
      decision,
    },
    timeline: [...(report.timeline || []), timelineItem],
  };

  saveOrUpdateReport(updated);
  return updated;
};

export const processGmApproval = (
  reportId: string,
  decision: 'APPROVED' | 'REJECTED',
  notes: string,
  approverName = 'Arifin'
): CncDailyReport => {
  const reports = loadReportsFromStorage();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Laporan tidak ditemukan');

  const now = new Date().toISOString();
  const newStatus: ReportStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';

  const timelineItem: ApprovalStep = {
    role: 'GM',
    actorName: approverName,
    action: decision,
    fromStatus: report.status,
    toStatus: newStatus,
    timestamp: now,
    note: notes || (decision === 'APPROVED' ? 'Disetujui Final oleh GM' : 'Ditolak oleh GM'),
  };

  const updated: CncDailyReport = {
    ...report,
    status: newStatus,
    updatedAt: now,
    gmApproval: {
      approvedAt: now,
      approverName,
      notes,
      decision,
    },
    timeline: [...(report.timeline || []), timelineItem],
  };

  saveOrUpdateReport(updated);
  return updated;
};

export const resetReportsToDemo = (): CncDailyReport[] => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
  return INITIAL_REPORTS;
};

export const deleteReport = (id: string): void => {
  const reports = loadReportsFromStorage().filter((r) => r.id !== id);
  saveReportsToStorage(reports);
};

export const clearAllReportsToZero = (): void => {
  saveReportsToStorage([]);
};

// Helper: UTF-8 safe base64 encoding & decoding for cross-device URL sharing
export const encodeReportForUrl = (report: CncDailyReport): string => {
  try {
    const jsonStr = JSON.stringify(report);
    // Encode to base64 with URI component safety
    return btoa(encodeURIComponent(jsonStr));
  } catch (e) {
    console.error('Failed to encode report for URL:', e);
    return '';
  }
};

export const decodeReportFromUrl = (encodedStr: string): CncDailyReport | null => {
  try {
    const jsonStr = decodeURIComponent(atob(encodedStr));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.id && parsed.operatorName !== undefined) {
      return parsed as CncDailyReport;
    }
    return null;
  } catch (e) {
    console.error('Failed to decode report from URL:', e);
    return null;
  }
};

export const getApprovalUrl = (token: string, role: 'supervisor' | 'gm', report?: CncDailyReport | string): string => {
  const baseUrl = window.location.origin + window.location.pathname;
  let reportId = '';
  let payloadParam = '';

  if (typeof report === 'string') {
    reportId = report;
    const found = getReportById(reportId);
    if (found) {
      const encoded = encodeReportForUrl(found);
      if (encoded) payloadParam = `&payload=${encodeURIComponent(encoded)}`;
    }
  } else if (report && typeof report === 'object') {
    reportId = report.id;
    const encoded = encodeReportForUrl(report);
    if (encoded) payloadParam = `&payload=${encodeURIComponent(encoded)}`;
  }

  return `${baseUrl}#approval?token=${encodeURIComponent(token)}&role=${role}${reportId ? `&id=${encodeURIComponent(reportId)}` : ''}${payloadParam}`;
};
