import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CheckSquare, Clock, CheckCircle2, XCircle, CalendarDays,
  User, Building2, Hash, MessageSquare, RefreshCw, Inbox, History, Send
} from 'lucide-react';

/**
 * Staff Dashboard — two tabs: Pending requests (with approve/reject actions)
 * and Resolved history. Premium glassmorphism design.
 */
const StaffDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondingId, setRespondingId] = useState(null);
  const [responseMessages, setResponseMessages] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/leaves/staff/pending`),
        axios.get(`${API_URL}/leaves/staff/history`)
      ]);
      if (pendingRes.data?.success) setPending(pendingRes.data.requests);
      if (historyRes.data?.success) setHistoryList(historyRes.data.history);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRespond = async (leaveId, status) => {
    setRespondingId(leaveId);
    try {
      await axios.put(`${API_URL}/leaves/respond/${leaveId}`, {
        status,
        responseMessage: responseMessages[leaveId] || ''
      });
      // Refresh data after response
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} leave.`);
    } finally {
      setRespondingId(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusConfig = {
    Approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
    Rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-400' }
  };

  const currentList = activeTab === 'pending' ? pending : historyList;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome, <span className="font-semibold text-indigo-600">{user?.name}</span> — {user?.designation} · {user?.department}
          </p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 text-sm font-medium transition-all btn-interactive">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Requests', count: pending.length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          { label: 'Approved', count: historyList.filter((l) => l.status === 'Approved').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
          { label: 'Rejected', count: historyList.filter((l) => l.status === 'Rejected').length, color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle }
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

      {/* Tab Navigation */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-6 max-w-sm">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          History ({historyList.length})
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">
          {error}
        </div>
      )}

      {/* Content Panel */}
      <div className="glass-panel rounded-2xl shadow-lg shadow-indigo-50/30">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="large" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Inbox className="w-14 h-14 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {activeTab === 'pending' ? 'No pending requests.' : 'No resolved requests yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentList.map((leave) => {
              const student = leave.studentId;
              const fromDate = formatDate(leave.fromDate);
              const toDate = formatDate(leave.toDate);
              const appliedDate = formatDate(leave.appliedDate);
              const isResponding = respondingId === leave._id;

              return (
                <div key={leave._id} className="px-6 py-5 hover:bg-slate-50/50 transition-colors">
                  {/* Student Info Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Status + Date */}
                      <div className="flex items-center gap-2 mb-2">
                        {activeTab === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Pending
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[leave.status]?.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[leave.status]?.dot}`}></span>
                            {leave.status}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">Applied {appliedDate}</span>
                      </div>

                      {/* Student details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700 font-medium mb-1">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" />{student?.name}</span>
                        <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-slate-400" />{student?.rollNumber}</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-400" />{student?.department}</span>
                      </div>

                      {/* Reason */}
                      <p className="text-sm text-slate-600 mb-1 line-clamp-2">{leave.reason}</p>

                      {/* Dates */}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {fromDate} — {toDate}
                      </span>
                    </div>

                    {/* Action Buttons (Pending Tab) */}
                    {activeTab === 'pending' && (
                      <div className="flex flex-col gap-2 sm:min-w-[220px]">
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <textarea
                            rows={2}
                            placeholder="Optional response message…"
                            value={responseMessages[leave._id] || ''}
                            onChange={(e) => setResponseMessages({ ...responseMessages, [leave._id]: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(leave._id, 'Approved')}
                            disabled={isResponding}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all btn-interactive disabled:opacity-50"
                          >
                            {isResponding ? <LoadingSpinner size="small" color="white" /> : <><CheckCircle2 className="w-3.5 h-3.5" />Approve</>}
                          </button>
                          <button
                            onClick={() => handleRespond(leave._id, 'Rejected')}
                            disabled={isResponding}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all btn-interactive disabled:opacity-50"
                          >
                            {isResponding ? <LoadingSpinner size="small" color="white" /> : <><XCircle className="w-3.5 h-3.5" />Reject</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Staff response (History Tab) */}
                    {activeTab === 'history' && leave.responseMessage && (
                      <div className="sm:max-w-xs bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 mt-2 sm:mt-0">
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-1">
                          <Send className="w-3 h-3" />
                          Your Response
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

export default StaffDashboard;
