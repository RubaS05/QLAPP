import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle2, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';

/**
 * Payment Success redirection page.
 * Verifies Stripe Checkout session status with backend API before showing success summary.
 */
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('Stripe Session ID is missing.');
        setLoading(false);
        return;
      }

      if (verificationAttempted.current) return;
      verificationAttempted.current = true;

      try {
        const res = await axios.get(`${API_URL}/payments/verify-session?session_id=${sessionId}`);
        if (res.data?.success) {
          setPayment(res.data.payment);
        } else {
          setError(res.data?.message || 'Payment verification failed.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error occurred while verifying payment session.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel rounded-2xl shadow-xl p-8 sm:p-10 text-center">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="large" />
              <p className="text-sm text-slate-500 mt-4 font-medium">Verifying transaction status…</p>
            </div>
          ) : error ? (
            <div className="py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-500 mb-4 border border-rose-200">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Verification Failed</h1>
              <p className="text-sm text-rose-600 mt-2 font-medium">{error}</p>
              <div className="mt-8 flex flex-col gap-2">
                <Link to="/payments" className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition btn-interactive">
                  Go Back to Payments
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-4 border border-emerald-200 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Payment Successful</h1>
              <p className="text-sm text-slate-500 mt-1">Thank you! Your transaction has been confirmed</p>

              {payment && (
                <div className="my-6 bg-slate-50 rounded-xl p-4 border border-slate-100 text-left">
                  <div className="flex justify-between border-b border-slate-200/50 pb-2 mb-2">
                    <span className="text-xs font-semibold text-slate-400">Description</span>
                    <span className="text-xs font-bold text-slate-700">{payment.description}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2 mb-2">
                    <span className="text-xs font-semibold text-slate-400">Amount Paid</span>
                    <span className="text-xs font-bold text-slate-700">${payment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold text-slate-400">Status</span>
                    <span className="text-xs font-bold text-emerald-600 capitalize">{payment.status}</span>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <Link to="/student-dashboard" className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition btn-interactive flex items-center justify-center gap-1.5">
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to="/payments" className="text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
                  View Payment History
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
