// ============================================================
// Vercel serverless entry — mounts the TalentIQ Express API.
//
// This catch-all function receives every request under /api/*
// and delegates it to the Express app compiled to apps/api/dist
// (see build.cjs, which runs `prisma generate` + `tsc` first).
//
// The Express app mounts its routes at /api (app.use('/api', routes)),
// so we normalize req.url to always begin with /api — Vercel may
// deliver the original path (/api/v1/...) or strip the function
// route prefix (/v1/...). Express 4 apps are plain (req, res)
// handlers, which is exactly what Vercel Node functions export.
// ============================================================

const app = require('../apps/api/dist/app.js').default;

module.exports = function handler(req, res) {
  const url = req.url || '';
  const qIndex = url.indexOf('?');
  const path = qIndex >= 0 ? url.slice(0, qIndex) : url;
  const query = qIndex >= 0 ? url.slice(qIndex) : '';

  if (!path.startsWith('/api')) {
    req.url = '/api' + (path.startsWith('/') ? '' : '/') + path + query;
  }

  return app(req, res);
};
