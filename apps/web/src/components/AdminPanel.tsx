import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Download, Award, RefreshCw, Key } from 'lucide-react';
import { api } from '../lib/api.js';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, statusFilter]);

  if (!isOpen) return null;

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      setIsAuthenticated(true);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminSubmissions(statusFilter || undefined, adminKey);
      setSubmissions(data.submissions || []);
      setStats(data.stats || {});
    } catch (err: any) {
      alert('Error fetching admin data: ' + err.message);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkWinner = async (bingoId: string, isWinner: boolean) => {
    try {
      await api.adminMarkWinner(bingoId, isWinner, isWinner ? 'Raffle Grand Winner' : undefined, adminKey);
      await loadData();
    } catch (err: any) {
      alert('Failed to update winner status: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white border-3 border-google-dark rounded-3xl p-5 sm:p-6 shadow-brutal-lg flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-google-dark" />
        </button>

        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-google-red/10 text-google-red rounded-xl border border-google-red">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-google-dark">
                Organizer Admin Panel
              </h3>
              <p className="text-xs text-google-grey">
                Manage attendees, verify bingo challenge submissions, and mark winners.
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <a
                href="/api/admin/export-csv"
                download
                className="px-3 py-1.5 text-xs font-bold bg-white border-2 border-google-dark rounded-xl flex items-center gap-1.5 hover:bg-gray-100 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-google-green" />
                <span>Export CSV</span>
              </a>
              <button
                onClick={loadData}
                className="p-1.5 border-2 border-google-dark rounded-xl hover:bg-gray-100 transition cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handleAdminAuth} className="py-12 max-w-sm mx-auto text-center space-y-4">
            <div className="w-12 h-12 bg-gray-100 border-2 border-google-dark rounded-2xl mx-auto flex items-center justify-center">
              <Key className="w-5 h-5 text-google-blue" />
            </div>
            <h4 className="font-bold text-sm text-google-dark">Enter Organizer Secret Key</h4>
            <input
              type="password"
              required
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Organizer secret pass"
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-google-dark rounded-xl text-center text-sm font-mono focus:outline-none focus:border-google-blue"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-google-blue text-white font-bold text-sm border-2 border-google-dark rounded-xl shadow-brutal hover:bg-blue-600 transition cursor-pointer"
            >
              Access Organizer View
            </button>
          </form>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Stat Counters */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-gray-50 border-2 border-google-dark rounded-xl">
                <span className="text-[10px] font-bold uppercase text-google-grey">Total Registered</span>
                <span className="text-base font-black text-google-dark block">{stats.total_participants || 0}</span>
              </div>
              <div className="p-2.5 bg-amber-50 border-2 border-google-dark rounded-xl">
                <span className="text-[10px] font-bold uppercase text-amber-700">Active Drafts</span>
                <span className="text-base font-black text-amber-700 block">{stats.active_drafts || 0}</span>
              </div>
              <div className="p-2.5 bg-blue-50 border-2 border-google-dark rounded-xl">
                <span className="text-[10px] font-bold uppercase text-google-blue">Submitted</span>
                <span className="text-base font-black text-google-blue block">{stats.submitted_count || 0}</span>
              </div>
              <div className="p-2.5 bg-green-50 border-2 border-google-dark rounded-xl">
                <span className="text-[10px] font-bold uppercase text-google-green">Winners</span>
                <span className="text-base font-black text-google-green block">{stats.winners_count || 0}</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 border-b border-gray-200 pb-2">
              {['', 'submitted', 'draft', 'winner'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-google-dark text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-google-dark'
                  }`}
                >
                  {st || 'All Attendees'}
                </button>
              ))}
            </div>

            {/* Submissions Table */}
            <div className="flex-1 overflow-auto border-2 border-google-dark rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 sticky top-0 border-b-2 border-google-dark font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Attendee</th>
                    <th className="p-3">Bingo ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Done</th>
                    <th className="p-3">Submitted</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((sub, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="p-3">
                        <span className="font-bold block text-google-dark">{sub.name}</span>
                        <span className="text-[10px] text-google-grey">{sub.email}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-google-blue">
                        {sub.bingo_id || 'Not Started'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          sub.status === 'winner' ? 'bg-green-100 text-green-800 border-green-600' :
                          sub.status === 'submitted' ? 'bg-blue-100 text-blue-800 border-blue-600' :
                          'bg-yellow-100 text-yellow-800 border-yellow-600'
                        }`}>
                          {sub.status || 'New'}
                        </span>
                      </td>
                      <td className="p-3 font-bold">
                        {sub.total_completed || 0} / 9
                      </td>
                      <td className="p-3 text-google-grey text-[10px]">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="p-3 text-right">
                        {sub.bingo_id && (
                          <button
                            type="button"
                            onClick={() => handleMarkWinner(sub.bingo_id, sub.status !== 'winner')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border border-google-dark transition flex items-center gap-1 ml-auto cursor-pointer ${
                              sub.status === 'winner'
                                ? 'bg-red-50 text-google-red hover:bg-red-100'
                                : 'bg-green-50 text-google-green hover:bg-green-100'
                            }`}
                          >
                            <Award className="w-3 h-3" />
                            <span>{sub.status === 'winner' ? 'Revoke Win' : 'Mark Winner'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-google-grey">
                        No participant cards found matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
