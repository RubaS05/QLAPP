import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { CreditCard, DollarSign, RefreshCw, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

/**
 * Payments page for students to pay dues/fees/fines using Stripe.
 * Shows payment history and checkout option.
 */
const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/payments/history`);
      if (res.data?.success) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please provide a valid payment amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for the payment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/payments/create-checkout-session`, {
        amount: parseFloat(amount),
        description: description.trim()
      });

      if (res.data?.success && res.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = res.data.url;
      } else {
        setError('Failed to initiate checkout session.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment checkout initialization failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusConfig = {
    paid: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Paid' },
    pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Pending' },
    failed: { color: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Failed' }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments & Fees</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student fee payments and fine clearances
          </p>
        </div>
        <button onClick={fetchPaymentHistory} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 text-sm font-medium transition-all btn-interactive">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Make a Payment Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl shadow-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              Make New Payment
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description / Fee Type</label>
                <input
                  type="text"
                  placeholder="e.g. Leave Fine, Semester Fee"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all btn-interactive disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay with Stripe
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Payment History List */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl shadow-lg">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Payment Log History
              </h2>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="medium" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16 px-6">
                <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">No payments recorded.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const cfg = statusConfig[p.status] || statusConfig.pending;
                  return (
                    <div key={p._id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(p.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">${p.amount.toFixed(2)}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          {cfg.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
