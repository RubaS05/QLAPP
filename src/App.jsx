import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ApplyLeave from './pages/ApplyLeave';
import Payments from './pages/Payments';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

import { GraduationCap, Calendar, FileText, CheckSquare, Mail } from 'lucide-react';

/**
 * Decorative floating background icons related to education and leave management.
 * Styled to float subtly in the background without obstructing any UI interaction.
 */
const BackgroundDecorations = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* Top Left Floating Graduation Cap */}
      <div className="absolute top-[15%] left-[8%] float-bg-1 text-indigo-600/5 hidden lg:block">
        <GraduationCap className="w-32 h-32" />
      </div>
      
      {/* Top Right Floating Calendar */}
      <div className="absolute top-[20%] right-[10%] float-bg-2 text-sky-500/5 hidden lg:block">
        <Calendar className="w-28 h-28" />
      </div>

      {/* Mid Left Floating File Text */}
      <div className="absolute bottom-[30%] left-[5%] float-bg-3 text-rose-500/4 hidden md:block">
        <FileText className="w-24 h-24" />
      </div>

      {/* Bottom Right Floating Check Square */}
      <div className="absolute bottom-[15%] right-[7%] float-bg-1 text-emerald-500/5 hidden lg:block">
        <CheckSquare className="w-36 h-36" />
      </div>

      {/* Mid Right Floating Mail */}
      <div className="absolute top-[50%] right-[4%] float-bg-3 text-indigo-500/4 hidden md:block">
        <Mail className="w-20 h-20" />
      </div>
    </div>
  );
};

/**
 * Helper component to redirect users from the root "/" URL 
 * to their respective dashboards or the login screen.
 */
const HomeRedirect = () => {
  const { user, token } = useAuth();

  if (token && user) {
    if (user.role === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    } else if (user.role === 'staff') {
      return <Navigate to="/staff-dashboard" replace />;
    }
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen relative overflow-hidden bg-transparent">
          {/* Theme Background Decorations */}
          <BackgroundDecorations />
          
          {/* Main Navigation */}
          <Navbar />

          {/* Page Routing */}
          <main className="flex-grow">
            <Routes>
              
              {/* Home Redirect */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Student Routes */}
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/apply-leave"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ApplyLeave />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-success"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <PaymentSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-cancel"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <PaymentCancel />
                  </ProtectedRoute>
                }
              />


              {/* Protected Staff Routes */}
              <Route
                path="/staff-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Catch-All Route */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </main>

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
