import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Download, Award, RefreshCw, Key, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { generateBingoCard, downloadBlob } from '../lib/cardExportUtil.js';

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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const handleDownloadParticipantA4 = async (sub: any) => {
    const targetId = sub.id || sub.bingo_id;
    setDownloadingId(targetId);
    try {
      const participant = {
        id: sub.participant_id || sub.id,
        name: sub.name || 'Attendee',
        email: sub.email || '',
        organization: sub.organization || 'Attendee'
      };
      const card = {
        id: sub.id,
        participant_id: sub.participant_id || sub.id,
        bingo_id: sub.bingo_id || 'Draft',
        status: sub.status || 'draft',
        tiles: sub.tiles || []
      };

      const { blob, fileName } = await generateBingoCard(participant as any, card as any, 'google-cloud');
      downloadBlob(blob, fileName);
    } catch (err: any) {
      console.error('Failed to export A4 Bingo Card:', err);
      alert('Failed to generate A4 Bingo Card: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleResetDatabase = async () => {
    const confirmation = window.confirm(
      '⚠️ ARE YOU SURE?\n\nThis will permanently delete all attendee registrations, bingo cards, and photo submissions from the database for a fresh clean slate.'
    );
    if (!confirmation) return;

    setIsLoading(true);
    try {
      await api.adminResetDatabase(adminKey);
      alert('All entries have been completely reset to 0.');
      await loadData();
    } catch (err: any) {
      alert('Failed to reset database: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white border-2 sm:border-3 border-google-dark rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-brutal-lg flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header Bar: Clean single row on both mobile and laptop */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3 gap-2 flex-shrink-0">
          {/* Left: Shield & Title */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-google-red/10 text-google-red rounded-xl border border-google-red flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-xl font-black text-google-dark tracking-tight">
              Admin Panel
            </h3>
          </div>

          {/* Right: Actions & Close Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isAuthenticated && (
              <>
                <a
                  href={`/api/admin/export-csv?adminKey=${encodeURIComponent(adminKey)}`}
                  download="gccd-bingo-submissions.csv"
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-white border border-google-dark sm:border-2 rounded-xl flex items-center gap-1 hover:bg-gray-100 transition shadow-xs"
                  title="Export Submissions CSV"
                >
                  <Download className="w-3.5 h-3.5 text-google-green flex-shrink-0" />
                  <span className="hidden sm:inline">Export </span>
                  <span>CSV</span>
                </a>

                <button
                  onClick={loadData}
                  className="p-1.5 border border-google-dark sm:border-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                  title="Refresh Table"
                  aria-label="Refresh Table"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleResetDatabase}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold bg-red-50 text-google-red border border-google-red sm:border-2 rounded-xl flex items-center gap-1 hover:bg-red-100 transition cursor-pointer"
                  title="Wipe database entries"
                  aria-label="Reset Database"
                >
                  <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden md:inline">Reset DB</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-google-dark transition cursor-pointer ml-1"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handleAdminAuth} className="py-10 max-w-sm mx-auto text-center space-y-4">
            <div className="w-12 h-12 bg-gray-100 border-2 border-google-dark rounded-2xl mx-auto flex items-center justify-center">
              <Key className="w-5 h-5 text-google-blue" />
            </div>
            <h4 className="font-bold text-sm text-google-dark">Enter Admin Secret Key</h4>
            <input
              type="password"
              required
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key (e.g. gccd2026)"
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-google-dark rounded-xl text-center text-sm font-mono focus:outline-none focus:border-google-blue"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-google-blue text-white font-bold text-sm border-2 border-google-dark rounded-xl shadow-brutal hover:bg-blue-600 transition cursor-pointer"
            >
              Access Admin Panel
            </button>
          </form>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden space-y-3 min-h-0">
            {/* Stat Counters: 2x2 grid on mobile, 4 columns on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 text-center flex-shrink-0">
              <div className="p-2 sm:p-2.5 bg-gray-50 border-2 border-google-dark rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-google-grey block">Total Registered</span>
                <span className="text-base sm:text-lg font-black text-google-dark block mt-0.5">{stats.total_participants || 0}</span>
              </div>
              <div className="p-2 sm:p-2.5 bg-amber-50 border-2 border-google-dark rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">Active Drafts</span>
                <span className="text-base sm:text-lg font-black text-amber-700 block mt-0.5">{stats.active_drafts || 0}</span>
              </div>
              <div className="p-2 sm:p-2.5 bg-blue-50 border-2 border-google-dark rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-google-blue block">Submitted</span>
                <span className="text-base sm:text-lg font-black text-google-blue block mt-0.5">{stats.submitted_count || 0}</span>
              </div>
              <div className="p-2 sm:p-2.5 bg-green-50 border-2 border-google-dark rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-google-green block">Winners</span>
                <span className="text-base sm:text-lg font-black text-google-green block mt-0.5">{stats.winners_count || 0}</span>
              </div>
            </div>

            {/* Filter Tabs: Horizontal smooth scrolling on narrow mobile */}
            <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar flex-shrink-0">
              {[
                { key: '', label: 'All Attendees' },
                { key: 'submitted', label: 'Submitted' },
                { key: 'draft', label: 'Drafts' },
                { key: 'winner', label: 'Winners' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1 rounded-full text-xs font-black transition cursor-pointer flex-shrink-0 ${
                    statusFilter === tab.key
                      ? 'bg-google-dark text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-google-dark'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile swipe hint */}
            <div className="sm:hidden flex items-center justify-between text-[10px] text-google-grey px-0.5 flex-shrink-0">
              <span className="font-bold">{submissions.length} Attendee{submissions.length === 1 ? '' : 's'}</span>
              <span className="text-google-blue font-bold">Swipe table sideways →</span>
            </div>

            {/* Submissions Table with smooth horizontal scroll and clear column spacing */}
            <div className="flex-1 overflow-x-auto overflow-y-auto border-2 border-google-dark rounded-2xl min-h-0 bg-white">
              <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                <thead className="bg-gray-100 sticky top-0 border-b-2 border-google-dark font-extrabold uppercase text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="p-2.5 sm:p-3">Attendee</th>
                    <th className="p-2.5 sm:p-3">Bingo ID</th>
                    <th className="p-2.5 sm:p-3">Status</th>
                    <th className="p-2.5 sm:p-3">Done</th>
                    <th className="p-2.5 sm:p-3">Submitted</th>
                    <th className="p-2.5 sm:p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((sub, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="p-2.5 sm:p-3">
                        <span className="font-black block text-google-dark">{sub.name}</span>
                        <span className="text-[10.5px] text-google-grey">{sub.email}</span>
                      </td>
                      <td className="p-2.5 sm:p-3 font-mono font-black text-google-blue">
                        {sub.bingo_id || 'Not Started'}
                      </td>
                      <td className="p-2.5 sm:p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          sub.status === 'winner' ? 'bg-green-100 text-green-800 border-green-600' :
                          sub.status === 'submitted' ? 'bg-blue-100 text-blue-800 border-blue-600' :
                          'bg-yellow-100 text-yellow-800 border-yellow-600'
                        }`}>
                          {sub.status || 'New'}
                        </span>
                      </td>
                      <td className="p-2.5 sm:p-3 font-extrabold text-google-dark">
                        {sub.total_completed || 0} / 9
                      </td>
                      <td className="p-2.5 sm:p-3 text-google-grey text-[10.5px]">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="p-2.5 sm:p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download A4 Card for participant */}
                          <button
                            type="button"
                            disabled={downloadingId === (sub.id || sub.bingo_id)}
                            onClick={() => handleDownloadParticipantA4(sub)}
                            className="px-2.5 py-1 text-[10px] font-black rounded-lg border border-google-dark bg-white hover:bg-gray-100 text-google-dark transition flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                            title="Download participant's A4 Bingo Card PNG"
                          >
                            {downloadingId === (sub.id || sub.bingo_id) ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-google-blue" />
                            ) : (
                              <Download className="w-3 h-3 text-google-blue" />
                            )}
                            <span>A4 Card</span>
                          </button>

                          {sub.bingo_id && (
                            <button
                              type="button"
                              onClick={() => handleMarkWinner(sub.bingo_id, sub.status !== 'winner')}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-lg border border-google-dark transition flex items-center gap-1 cursor-pointer shadow-xs ${
                                sub.status === 'winner'
                                  ? 'bg-red-50 text-google-red border-google-red hover:bg-red-100'
                                  : 'bg-green-50 text-google-green border-google-green hover:bg-green-100'
                              }`}
                            >
                              <Award className="w-3 h-3" />
                              <span>{sub.status === 'winner' ? 'Revoke' : 'Winner'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-google-grey font-bold text-xs">
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
