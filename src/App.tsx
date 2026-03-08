/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, Activity, Users, AlertTriangle, Settings, Bell } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">EpiGuard</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-medium">
            AD
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 hidden md:block">
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium">
              <Activity className="w-5 h-5" />
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg font-medium transition-colors">
              <AlertTriangle className="w-5 h-5" />
              Alerts
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg font-medium transition-colors">
              <Users className="w-5 h-5" />
              Patients
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg font-medium transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Cases</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">1,248</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Alerts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">Healthy</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">New patient record updated in Ward {i}</p>
                    </div>
                    <span className="text-xs text-gray-400">{i * 10} mins ago</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
