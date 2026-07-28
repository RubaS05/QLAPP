import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserPlus, Mail, Lock, User, GraduationCap, Briefcase, Hash, Building2, BadgeCheck } from 'lucide-react';

/**
 * Premium Registration page with role toggle (Student / Staff).
 * Dynamically shows different fields based on selected role.
 */
const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    department: '',
    designation: ''
  });
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError(null);

    const { name, email, password, confirmPassword, rollNumber, department, designation } = formData;

    // Common validations
    if (!name || !email || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    // Role-specific validations
    if (role === 'student' && (!rollNumber || !department)) {
      setLocalError('Please provide Roll Number and Department.');
      return;
    }

    if (role === 'staff' && (!department || !designation)) {
      setLocalError('Please provide Department and Designation.');
      return;
    }

    // Build payload
    const payload =
      role === 'student'
        ? { name, email, password, rollNumber, department }
        : { name, email, password, department, designation };

    setSubmitting(true);
    try {
      const result = await register(payload, role);
      if (result?.success) {
        navigate(role === 'student' ? '/student-dashboard' : '/staff-dashboard');
      }
    } catch (err) {
      setLocalError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="glass-panel rounded-2xl shadow-xl shadow-indigo-100/40 p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
              <UserPlus className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1">Join the LMS Portal today</p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                role === 'student'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('staff')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                role === 'staff'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Staff
            </button>
          </div>

          {/* Error Alert */}
          {displayError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium animate-pulse">
              {displayError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
            </div>

            {/* Two-column grid for role-specific fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {role === 'student' && (
                <div>
                  <label htmlFor="reg-roll" className="block text-sm font-semibold text-slate-700 mb-1.5">Roll Number</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="reg-roll" name="rollNumber" type="text" value={formData.rollNumber} onChange={handleChange} placeholder="e.g. 23CSB35"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="reg-dept" className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="reg-dept" name="department" type="text" value={formData.department} onChange={handleChange} placeholder="e.g. CSE"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                </div>
              </div>

              {role === 'staff' && (
                <div>
                  <label htmlFor="reg-desig" className="block text-sm font-semibold text-slate-700 mb-1.5">Designation</label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="reg-desig" name="designation" type="text" value={formData.designation} onChange={handleChange} placeholder="e.g. Professor"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                  </div>
                </div>
              )}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-pass" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="reg-pass" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                </div>
              </div>
              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="reg-confirm" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all btn-interactive disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Register as {role === 'student' ? 'Student' : 'Staff'}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
