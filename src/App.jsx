import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider } from './context/WorkoutContext';
import BottomNav from './components/BottomNav';
import SideMenu from './components/SideMenu';
import Toast from './components/Toast';
import Exercises from './pages/Exercises';
import ManageEquipment from './pages/ManageEquipment';
import ManageMovementTypes from './pages/ManageMovementTypes';
import ComingSoon from './pages/ComingSoon';
import Log from './pages/Log';
import Progress from './pages/Progress';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', color:'var(--text3)' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/login"  element={user ? <Navigate to="/exercises" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/exercises" replace /> : <Signup />} />
        <Route path="/" element={<Navigate to="/exercises" replace />} />

        <Route path="/exercises" element={
          <ProtectedRoute><Exercises onMenuOpen={() => setMenuOpen(true)} /></ProtectedRoute>
        } />
        <Route path="/log" element={
          <ProtectedRoute><Log onMenuOpen={() => setMenuOpen(true)} /></ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute><Progress onMenuOpen={() => setMenuOpen(true)} /></ProtectedRoute>
        } />
        <Route path="/manage/equipment" element={
          <ProtectedRoute><ManageEquipment /></ProtectedRoute>
        } />
        <Route path="/manage/movement-types" element={
          <ProtectedRoute><ManageMovementTypes /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><ComingSoon icon="⚙️" title="Settings" description="App settings and preferences. Coming soon." /></ProtectedRoute>
        } />
      </Routes>

      {user && <BottomNav />}
      {user && <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkoutProvider>
          <AppRoutes />
        </WorkoutProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
