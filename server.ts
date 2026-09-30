import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json({ limit: '15mb' }));

// In-memory + persistent file storage for reports (so all devices share the exact same database)
const DATA_FILE = path.resolve(process.cwd(), 'reports_store.json');

const loadReportsFromFile = (): any[] => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading reports_store.json:', err);
  }
  return [];
};

const saveReportsToFile = (data: any[]): void => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing reports_store.json:', err);
  }
};

// API: Get all reports
app.get('/api/reports', (req, res) => {
  const reports = loadReportsFromFile();
  res.json(reports);
});

// API: Get single report by ID or Token
app.get('/api/reports/:idOrToken', (req, res) => {
  const { idOrToken } = req.params;
  const reports = loadReportsFromFile();
  const found = reports.find(
    (r) => r.id === idOrToken || r.supervisorToken === idOrToken || r.gmToken === idOrToken
  );
  if (!found) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(found);
});

// API: Create or update a report (sync across all devices)
app.post('/api/reports', (req, res) => {
  const report = req.body;
  if (!report || !report.id) {
    return res.status(400).json({ error: 'Invalid report data' });
  }

  const reports = loadReportsFromFile();
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

  saveReportsToFile(reports);
  res.json({ success: true, report: updatedReport });
});

// API: Delete single report
app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const reports = loadReportsFromFile();
  const filtered = reports.filter((r) => r.id !== id);
  saveReportsToFile(filtered);
  res.json({ success: true });
});

// API: Clear all reports
app.post('/api/reports/clear', (req, res) => {
  saveReportsToFile([]);
  res.json({ success: true });
});

// Mount Vite middleware for dev or serve static dist in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
