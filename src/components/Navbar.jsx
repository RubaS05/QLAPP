import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap, User, FileText, CheckSquare, CreditCard } from 'lucide-react';

/**
 * Premium responsive navigation bar that adapts dynamically to student and staff sessions.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand/Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            LMS<span className="text-indigo-600">Portal</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              {/* Authenticated Links */}
              {user.role === 'student' && (
                <>
                  <Link
                    to="/student-dashboard"
                    className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/payments"
                    className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    Payments
                  </Link>
                  <Link
                    to="/apply-leave"
                    className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all shadow-sm shadow-indigo-100 flex items-center gap-1.5 btn-interactive"
                  >
                    Apply Leave
                  </Link>
                </>
              )}

              {user.role === 'staff' && (
                <Link
                  to="/staff-dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                >
                  <CheckSquare className="w-4 h-4" />
                  Staff Dashboard
                </Link>
              )}

              {/* User Profile Summary */}
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                  <span className="text-xs font-medium text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded self-end">
                    {user.role}
                  </span>
                </div>
                <div className="bg-slate-100 text-slate-600 p-2 rounded-xl border border-slate-200">
                  <User className="w-4 h-4" />
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 btn-interactive"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Guest Links */}
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all btn-interactive"
              >
                Register
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
