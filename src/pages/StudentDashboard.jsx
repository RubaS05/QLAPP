import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FileText, Clock, CheckCircle2, XCircle, CalendarDays,
  Plus, User, Building2, Paperclip, MessageSquare, RefreshCw
} from 'lucide-react';

/**
 * Student Dashboard — displays leave request history with status badges,
 * a summary stats bar, and quick action to apply for a new leave.
 */
const StudentDashboard = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/leaves/student/history`);
      if (res.data?.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Stats
  const totalLeaves = history.length;
  const pendingCount = history.filter((l) => l.status === 'Pending').length;
  const approvedCount = history.filter((l) => l.status === 'Approved').length;
  const rejectedCount = history.filter((l) => l.status === 'Rejected').length;

  const statusConfig = {
    Pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, dot: 'bg-amber-400' },
    Approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, dot: 'bg-emerald-400' },
    Rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, dot: 'bg-rose-400' }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-indigo-600">{user?.name}</span> — {user?.department} · {user?.rollNumber}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchHistory} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all btn-interactive" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link to="/apply-leave" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all btn-interactive">
            <Plus className="w-4 h-4" />
            Apply Leave
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', count: totalLeaves, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: FileText },
          { label: 'Pending', count: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          { label: 'Approved', count: approvedCount, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
          { label: 'Rejected', count: rejectedCount, color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle }
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} className="glass-panel rounded-2xl p-5 flex items-center gap-4">
            <div className={`${bg} ${color} p-3 rounded-xl`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Leave History */}
      <div className="glass-panel rounded-2xl shadow-lg shadow-indigo-50/30">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            Leave Request History
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="text-center py-16 px-6">
            <XCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />
            <p className="text-rose-600 font-medium">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 px-6">
            <FileText className="w-14 h-14 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No leave requests yet.</p>
            <p className="text-sm text-slate-400 mt-1">Click "Apply Leave" to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((leave) => {
              const cfg = statusConfig[leave.status] || statusConfig.Pending;
              const StatusIcon = cfg.icon;
              const fromDate = new Date(leave.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              const toDate = new Date(leave.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              const appliedDate = new Date(leave.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

              return (
                <div key={leave._id} className="px-6 py-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                          {leave.status}
                        </span>
                        <span className="text-xs text-slate-400">Applied {appliedDate}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium mb-1 line-clamp-2">{leave.reason}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {fromDate} — {toDate}
                        </span>
                        {leave.staffId && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {leave.staffId.name} · {leave.staffId.department}
                          </span>
                        )}
                        {leave.attachmentName && (
                          <span className="flex items-center gap-1 text-indigo-500">
                            <Paperclip className="w-3.5 h-3.5" />
                            {leave.attachmentName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Response message */}
                    {leave.responseMessage && (
                      <div className="sm:max-w-xs bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 mt-2 sm:mt-0">
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3" />
                          Staff Response
                        </p>
                        <p className="text-sm text-slate-600 italic">"{leave.responseMessage}"</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
