import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, Shield, Bell, Key, AlertTriangle,
  Save, Eye, EyeOff, Plus, Trash2, Copy
} from 'lucide-react';

const tabs = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

const teamMembers = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@techvista.io', role: 'ORG_ADMIN', status: 'active' },
  { id: '2', name: 'Mike Johnson', email: 'mike@techvista.io', role: 'RECRUITER', status: 'active' },
  { id: '3', name: 'Emily Davis', email: 'emily@techvista.io', role: 'HIRING_MANAGER', status: 'active' },
  { id: '4', name: 'James Wilson', email: 'james@techvista.io', role: 'INTERVIEWER', status: 'pending' },
];

const apiKeys = [
  { id: '1', name: 'Production', key: 'tiq_prod_a1b2c3d4e5f6', created: '2024-01-15', lastUsed: '2 hours ago' },
  { id: '2', name: 'Development', key: 'tiq_dev_x7y8z9w0v1u2', created: '2024-02-20', lastUsed: '5 minutes ago' },
  { id: '3', name: 'CI/CD Pipeline', key: 'tiq_ci_m3n4o5p6q7r8', created: '2024-03-10', lastUsed: '1 day ago' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your organization settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Organization Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Organization Name</label>
                        <input
                          type="text"
                          defaultValue="TechVista Inc."
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                          <input
                            type="text"
                            defaultValue="Technology"
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Company Size</label>
                          <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>1-50 employees</option>
                            <option>51-200 employees</option>
                            <option>201-1000 employees</option>
                            <option>1000+ employees</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <input
                          type="url"
                          defaultValue="https://techvista.io"
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">AI Configuration</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-800">
                        <div>
                          <p className="text-sm font-medium text-white">Automatic Resume Parsing</p>
                          <p className="text-xs text-gray-400 mt-1">Automatically extract information from uploaded resumes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-800">
                        <div>
                          <p className="text-sm font-medium text-white">AI Match Scoring</p>
                          <p className="text-xs text-gray-400 mt-1">Use AI to score candidate-job matches</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-white">Fairness Monitoring</p>
                          <p className="text-xs text-gray-400 mt-1">Monitor hiring patterns for potential bias</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Team Members</h3>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <Plus className="w-4 h-4" />
                      Invite Member
                    </button>
                  </div>
                  <div className="overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Member</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.map((member) => (
                          <tr key={member.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{member.name}</p>
                                  <p className="text-gray-400 text-xs">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.role === 'ORG_ADMIN' ? 'bg-red-500/20 text-red-400' :
                                member.role === 'RECRUITER' ? 'bg-blue-500/20 text-blue-400' :
                                member.role === 'HIRING_MANAGER' ? 'bg-green-500/20 text-green-400' :
                                'bg-purple-500/20 text-purple-400'
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                member.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  member.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                                }`}></span>
                                {member.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button className="text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Password Policy</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-800">
                        <div>
                          <p className="text-sm font-medium text-white">Require Strong Passwords</p>
                          <p className="text-xs text-gray-400 mt-1">Minimum 8 characters with uppercase, lowercase, and numbers</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-800">
                        <div>
                          <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                          <p className="text-xs text-gray-400 mt-1">Require 2FA for all team members</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-white">Session Timeout</p>
                          <p className="text-xs text-gray-400 mt-1">Automatically log out inactive users</p>
                        </div>
                        <select className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>30 minutes</option>
                          <option>1 hour</option>
                          <option>4 hours</option>
                          <option>8 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'New candidate applications', desc: 'Get notified when a candidate applies' },
                      { label: 'Interview reminders', desc: 'Receive reminders before scheduled interviews' },
                      { label: 'AI analysis complete', desc: 'Notify when AI finishes processing resumes' },
                      { label: 'Fairness alerts', desc: 'Alert when potential bias is detected' },
                      { label: 'Weekly recruitment digest', desc: 'Summary of recruitment metrics and activity' },
                      { label: 'Team member changes', desc: 'Notify when team members join or leave' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={i < 4} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">API Keys</h3>
                      <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        Generate Key
                      </button>
                    </div>
                    <div className="space-y-3">
                      {apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-medium text-white">{apiKey.name}</p>
                              <span className="text-xs text-gray-500">Created {apiKey.created}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="text-sm text-gray-300 bg-gray-900 px-2 py-1 rounded">
                                {showKeys[apiKey.id] ? apiKey.key : apiKey.key.slice(0, 8) + '••••••••'}
                              </code>
                              <button onClick={() => toggleKey(apiKey.id)} className="text-gray-400 hover:text-white">
                                {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button className="text-gray-400 hover:text-white">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Last used: {apiKey.lastUsed}</p>
                            <button className="mt-2 text-xs text-red-400 hover:text-red-300">Revoke</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-sm text-gray-400 mb-6">These actions are irreversible. Please be certain.</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <div>
                        <p className="text-sm font-medium text-white">Delete Organization</p>
                        <p className="text-xs text-gray-400 mt-1">Permanently delete this organization and all its data</p>
                      </div>
                      <button className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Delete Organization
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <div>
                        <p className="text-sm font-medium text-white">Export All Data</p>
                        <p className="text-xs text-gray-400 mt-1">Download all your data as JSON</p>
                      </div>
                      <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Export Data
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <div>
                        <p className="text-sm font-medium text-white">Transfer Ownership</p>
                        <p className="text-xs text-gray-400 mt-1">Transfer organization ownership to another member</p>
                      </div>
                      <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Transfer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
