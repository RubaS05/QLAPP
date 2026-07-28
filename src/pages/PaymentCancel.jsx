import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronRight } from 'lucide-react';

/**
 * Payment Cancel page shown when a student cancels the Stripe checkout session.
 */
const PaymentCancel = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel rounded-2xl shadow-xl p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-500 mb-4 border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800">Payment Cancelled</h1>
          <p className="text-sm text-slate-500 mt-2">
            The checkout session was cancelled. No charges were made to your account.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link to="/payments" className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition btn-interactive flex items-center justify-center gap-1.5">
              Retry Payment
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/student-dashboard" className="text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
