import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Send, CalendarDays, User, FileText, Paperclip, Upload, X, ChevronDown
} from 'lucide-react';

/**
 * Apply Leave page — form for students to submit leave requests.
 * Includes staff dropdown, date pickers, reason textarea, and optional file attachment.
 */
const ApplyLeave = () => {
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    staffId: '',
    reason: '',
    fromDate: '',
    toDate: ''
  });
  const [attachment, setAttachment] = useState(null);

  // Fetch staff list for the dropdown
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${API_URL}/leaves/staff-list`);
        if (res.data?.success) {
          setStaffList(res.data.staff);
        }
      } catch (err) {
        setError('Failed to load staff list. Please refresh.');
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size (5MB limit)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and PDF files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be under 5 MB.');
        return;
      }
      setAttachment(file);
      setError('');
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { staffId, reason, fromDate, toDate } = formData;

    if (!staffId || !reason || !fromDate || !toDate) {
      setError('Please fill in all required fields.');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setSubmitting(true);
    try {
      // Use FormData to support file upload
      const payload = new FormData();
      payload.append('staffId', staffId);
      payload.append('reason', reason);
      payload.append('fromDate', fromDate);
      payload.append('toDate', toDate);
      if (attachment) {
        payload.append('attachment', attachment);
      }

      const res = await axios.post(`${API_URL}/leaves/apply`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setSuccess(res.data.message || 'Leave application submitted successfully!');
        // Reset form
        setFormData({ staffId: '', reason: '', fromDate: '', toDate: '' });
        setAttachment(null);
        // Redirect after short delay
        setTimeout(() => navigate('/student-dashboard'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Card */}
      <div className="glass-panel rounded-2xl shadow-xl shadow-indigo-100/40 p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Apply for Leave</h1>
          <p className="text-sm text-slate-500 mt-1">Fill in the details below to submit your leave request</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-600 font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Staff Selection */}
          <div>
            <label htmlFor="leave-staff" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Assign To (Staff Member)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {loadingStaff ? (
                <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                  Loading staff list…
                </div>
              ) : (
                <select
                  id="leave-staff"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none cursor-pointer"
                >
                  <option value="">— Select a staff member —</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.designation || s.department}
                    </option>
                  ))}
                </select>
              )}
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="leave-from" className="block text-sm font-semibold text-slate-700 mb-1.5">From Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="leave-from"
                  name="fromDate"
                  type="date"
                  value={formData.fromDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>
            <div>
              <label htmlFor="leave-to" className="block text-sm font-semibold text-slate-700 mb-1.5">To Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="leave-to"
                  name="toDate"
                  type="date"
                  value={formData.toDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="leave-reason" className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Leave</label>
            <textarea
              id="leave-reason"
              name="reason"
              rows={4}
              value={formData.reason}
              onChange={handleChange}
              placeholder="Please describe why you need leave…"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Attachment <span className="font-normal text-slate-400">(optional — JPEG, PNG, PDF, max 5 MB)</span>
            </label>
            {attachment ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <Paperclip className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="text-sm text-indigo-700 font-medium truncate flex-1">{attachment.name}</span>
                <button type="button" onClick={removeAttachment} className="p-1 hover:bg-indigo-100 rounded-lg transition">
                  <X className="w-4 h-4 text-indigo-400" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer text-sm text-slate-500 hover:text-indigo-600">
                <Upload className="w-5 h-5" />
                Click to upload file
                <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all btn-interactive disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Leave Application
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
