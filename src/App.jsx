import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import BottomNav from './components/BottomNav';
import SideMenu from './components/SideMenu';
import Toast from './components/Toast';
import Exercises from './pages/Exercises';
import ManageEquipment from './pages/ManageEquipment';
import ManageMovementTypes from './pages/ManageMovementTypes';
import ComingSoon from './pages/ComingSoon';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/exercises" replace />} />
        <Route path="/exercises" element={<Exercises onMenuOpen={() => setMenuOpen(true)} />} />
        <Route path="/log" element={
          <ComingSoon icon="📋" title="Workout Log" description="Log your sets, reps & weight for each session. Coming in the next build." />
        } />
        <Route path="/progress" element={
          <ComingSoon icon="📈" title="Progress" description="Track your PRs and strength over time. Coming soon." />
        } />
        <Route path="/manage/equipment" element={<ManageEquipment />} />
        <Route path="/manage/movement-types" element={<ManageMovementTypes />} />
        <Route path="/settings" element={
          <ComingSoon icon="⚙️" title="Settings" description="App settings and preferences. Coming soon." />
        } />
      </Routes>

      <BottomNav />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Toast />
    </BrowserRouter>
  );
}
