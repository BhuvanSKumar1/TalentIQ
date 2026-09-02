import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, FileText, Briefcase, Upload, Search, Settings, Clock } from 'lucide-react';

const logs = [
  { timestamp: '2026-08-25 14:32:10', user: 'Sarah Chen', action: 'Created job', entity: 'Senior Full-Stack Engineer', type: 'create', icon: Briefcase },
  { timestamp: '2026-08-25 14:28:45', user: 'Sarah Chen', action: 'Uploaded resume', entity: 'Demo Candidate', type: 'upload', icon: Upload },
  { timestamp: '2026-08-25 14:15:22', user: 'Sarah Chen', action: 'Ran AI matching', entity: 'DevOps Engineer', type: 'ai', icon: Shield },
  { timestamp: '2026-08-25 13:45:11', user: 'Sarah Chen', action: 'Shortlisted candidate', entity: 'Rahul Patel → Senior Full-Stack', type: 'update', icon: User },
  { timestamp: '2026-08-25 13:30:00', user: 'Sarah Chen', action: 'Ran search query', entity: '"Python developers with ML"', type: 'search', icon: Search },
  { timestamp: '2026-08-25 12:15:33', user: 'Sarah Chen', action: 'Updated organization settings', entity: 'TechVista Solutions', type: 'settings', icon: Settings },
  { timestamp: '2026-08-25 11:00:00', user: 'Sarah Chen', action: 'Created job', entity: 'Machine Learning Engineer', type: 'create', icon: Briefcase },
  { timestamp: '2026-08-25 10:30:22', user: 'Sarah Chen', action: 'Generated interview questions', entity: 'Senior Full-Stack Engineer', type: 'ai', icon: FileText },
  { timestamp: '2026-08-25 09:15:10', user: 'Sarah Chen', action: 'Viewed candidate profile', entity: 'Priyanka Desai', type: 'view', icon: User },
  { timestamp: '2026-08-24 17:30:00', user: 'Sarah Chen', action: 'Ran fairness audit', entity: 'Global', type: 'audit', icon: Shield },
];

const actionColors: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-400',
  update: 'bg-blue-500/10 text-blue-400',
  upload: 'bg-purple-500/10 text-purple-400',
  search: 'bg-amber-500/10 text-amber-400',
  ai: 'bg-cyan-500/10 text-cyan-400',
  settings: 'bg-gray-500/10 text-gray-400',
  view: 'bg-indigo-500/10 text-indigo-400',
  audit: 'bg-red-500/10 text-red-400',
};

export default function AuditLogsPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="w-6 h-6 text-blue-400" /> Audit Logs</h1>
          <p className="text-sm text-gray-400 mt-1">Complete activity trail for compliance and accountability</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Entity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{log.timestamp}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{log.user}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.type] || 'bg-gray-800 text-gray-400'}`}>
                        {React.createElement(log.icon, { className: 'w-3 h-3' })}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{log.entity}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
