import React, { useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { auth } from './api';
import { LoginPage } from './pages/LoginPage';
import { PendingDoctorsPage } from './pages/PendingDoctorsPage';
import { DiseasesPage } from './pages/DiseasesPage';
import { MedicationsPage } from './pages/MedicationsPage';

export function App() {
  const [authed, setAuthed] = useState(auth.hasToken());

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="app">
      <Sidebar onLogout={() => setAuthed(false)} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/doctors" replace />} />
          <Route path="/doctors" element={<PendingDoctorsPage />} />
          <Route path="/diseases" element={<DiseasesPage />} />
          <Route path="/medications" element={<MedicationsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const nav = useNavigate();
  return (
    <aside className="sidebar">
      <h1>Limitless Care<br />Owner Panel</h1>
      <nav>
        <NavLink to="/doctors" className={({ isActive }) => (isActive ? 'active' : '')}>
          Doktor Onayları
        </NavLink>
        <NavLink to="/diseases" className={({ isActive }) => (isActive ? 'active' : '')}>
          Hastalıklar
        </NavLink>
        <NavLink to="/medications" className={({ isActive }) => (isActive ? 'active' : '')}>
          İlaçlar
        </NavLink>
      </nav>
      <button
        className="logout"
        onClick={() => {
          auth.logout();
          onLogout();
          nav('/');
        }}
      >
        Çıkış Yap
      </button>
    </aside>
  );
}
