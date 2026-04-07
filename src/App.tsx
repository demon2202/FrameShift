
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Profile } from './pages/Profile';
import { Analytics } from './pages/Analytics';
import { Messages } from './pages/Messages';
import { Login } from './pages/Login';
import { BottomNav } from './components/BottomNav';
import { GlobalProvider } from './context/GlobalContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { OnboardingModal } from './components/OnboardingModal';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-cream dark:bg-neutral-900 text-olive-dark dark:text-cream transition-colors duration-300">
      <div className="grain" />
      <main className={`flex-1 w-full`}>
        {children}
      </main>
      <BottomNav />
      <OnboardingModal />
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/explore" element={<Explore />} />
          
          {/* Fix for external links/params trying to route to stories-rail */}
          <Route path="/stories-rail" element={<Navigate to="/" replace state={{ scrollTo: 'stories-rail' }} />} />
          <Route path="/stories-rail/" element={<Navigate to="/" replace state={{ scrollTo: 'stories-rail' }} />} />
          
          {/* Protected Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:userId" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
};

export default App;
