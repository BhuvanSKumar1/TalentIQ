import React from 'react';
import { motion } from 'framer-motion';
import { Bell, User, Briefcase, FileText, Shield, Clock, CheckCircle2 } from 'lucide-react';

const notifications = [
  { id: 1, title: 'New application received', message: 'Rahul Patel applied for Senior Full-Stack Engineer', time: '5 min ago', read: false, type: 'application', icon: Briefcase },
  { id: 2, title: 'AI match completed', message: 'Matching analysis completed for DevOps Engineer — 3 candidates identified', time: '15 min ago', read: false, type: 'ai', icon: FileText },
  { id: 3, title: 'Interview scheduled', message: 'Interview with Priyanka Desai scheduled for tomorrow at 2:00 PM', time: '1 hour ago', read: true, type: 'interview', icon: Clock },
  { id: 4, title: 'Resume processed', message: 'Demo Candidate resume parsed and profile created with 22 skills extracted', time: '2 hours ago', read: true, type: 'system', icon: CheckCircle2 },
  { id: 5, title: 'Fairness audit complete', message: 'Monthly fairness audit completed — 2 items require attention', time: '3 hours ago', read: true, type: 'audit', icon: Shield },
  { id: 6, title: 'New candidate shortlisted', message: 'Alexander Petrov was shortlisted for Machine Learning Engineer', time: '5 hours ago', read: true, type: 'update', icon: User },
];

const typeColors: Record<string, string> = {
  application: 'bg-blue-500/10 border-blue-500/20',
  ai: 'bg-purple-500/10 border-purple-500/20',
  interview: 'bg-amber-500/10 border-amber-500/20',
  system: 'bg-gray-500/10 border-gray-500/20',
  audit: 'bg-red-500/10 border-red-500/20',
  update: 'bg-emerald-500/10 border-emerald-500/20',
};

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="w-6 h-6 text-blue-400" /> Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">Stay updated on recruitment activities</p>
        </div>

        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                n.read ? 'bg-gray-900/30 border-gray-800/50' : 'bg-gray-900/60 border-gray-700/50'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[n.type]}`}>
                <n.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-medium ${n.read ? 'text-gray-300' : 'text-white'}`}>{n.title}</h3>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-600 mt-1">{n.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
