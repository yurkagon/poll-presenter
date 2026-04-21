import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { HomePage } from './pages/HomePage';
import { PresenterPage } from './pages/PresenterPage';
import { ParticipantPage } from './pages/ParticipantPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/present/:code" element={<PresenterPage />} />
        <Route path="/join/:code" element={<ParticipantPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
