
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Profile } from './pages/Profile';
import { Analytics } from './pages/Analytics';
import { Messages } from './pages/Messages';
import { Login } from './pages/Login';
import { BottomNav } from './components/BottomNav';
import { GlobalProvider, useGlobalContext } from './context/GlobalContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { OnboardingModal } from './components/OnboardingModal';

import { Toaster } from 'react-hot-toast';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-cream dark:bg-neutral-900 text-olive-dark dark:text-cream transition-colors duration-300">
      <div className="grain" />
      <main className={`flex-1 w-full`}>
        {children}
      </main>
      <BottomNav />
      <OnboardingModal />
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #ccff00',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#ccff00',
              secondary: '#1a1a1a',
            },
          },
        }}
      />
    </div>
  );
};

import { AppSkeleton } from './components/AppSkeleton';

import { AnimatePresence, motion } from 'framer-motion';

const AppContent: React.FC = () => {
  const { isLoading } = useGlobalContext();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2500); // 2.5 seconds minimum loading time
    return () => clearTimeout(timer);
  }, []);

  const showLoading = isLoading || !minTimePassed;

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoading && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999]"
          >
            <AppSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {!showLoading && (
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
    )}
    </>
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
