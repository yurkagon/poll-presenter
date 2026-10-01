import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { PresenterPage } from './pages/PresenterPage';
import { ParticipantPage } from './pages/ParticipantPage';
import { RequireAuth } from './components/auth/RequireAuth';
import { AdminLayout } from './components/frames/AdminLayout';
import { AdminSchedulePage } from './pages/admin/AdminSchedulePage';
import { AdminEventFormPage } from './pages/admin/AdminEventFormPage';
import { AdminResultsEntryPage } from './pages/admin/AdminResultsEntryPage';
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage';
import { AdminControlPage } from './pages/admin/AdminControlPage';
import { PrayerPollScreenPage } from './pages/prayer-poll/PrayerPollScreenPage';
import { PrayerPollJoinPage } from './pages/prayer-poll/PrayerPollJoinPage';
import { PrayerPollControlPage } from './pages/prayer-poll/PrayerPollControlPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/present" element={<PresenterPage />} />
        <Route path="/join" element={<ParticipantPage />} />
        <Route path="/prayer-poll" element={<PrayerPollScreenPage />} />
        <Route path="/prayer-poll/join" element={<PrayerPollJoinPage />} />
        <Route
          path="/prayer-poll/control"
          element={
            <RequireAuth>
              <PrayerPollControlPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminSchedulePage />} />
          <Route path="events/new" element={<AdminEventFormPage />} />
          <Route path="results" element={<AdminResultsEntryPage />} />
          <Route path="teams" element={<AdminTeamsPage />} />
          <Route path="control" element={<AdminControlPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
