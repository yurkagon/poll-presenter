import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { HomePage } from './pages/HomePage';
import { PresenterPage } from './pages/PresenterPage';
import { ParticipantPage } from './pages/ParticipantPage';
import { ScreenPage } from './pages/ScreenPage';
import { TalkShowHomePage } from './pages/talk-show/TalkShowHomePage';
import { TalkShowScreenPage } from './pages/talk-show/TalkShowScreenPage';
import { TalkShowAdminPage } from './pages/talk-show/TalkShowAdminPage';
import { TalkShowJoinPage } from './pages/talk-show/TalkShowJoinPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/present/:code" element={<PresenterPage />} />
        <Route path="/join/:code" element={<ParticipantPage />} />
        <Route path="/screen/:code" element={<ScreenPage />} />
        <Route path="/talk-show" element={<TalkShowHomePage />} />
        <Route path="/talk-show/screen" element={<TalkShowScreenPage />} />
        <Route path="/talk-show/admin" element={<TalkShowAdminPage />} />
        <Route path="/talk-show/join" element={<TalkShowJoinPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
