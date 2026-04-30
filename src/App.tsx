
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

import { AppSkeleton } from './components/AppSkeleton';
import { AnimatePresence, motion } from 'framer-motion';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-cream dark:bg-neutral-900 text-olive-dark dark:text-cream transition-colors duration-300">
      <div className="grain" />
      <main className={`flex-1 w-full pb-16 md:pb-0`}>
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

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <Home />
          </PageTransition>
        } />
        <Route path="/login" element={
          <PageTransition>
            <Login />
          </PageTransition>
        } />
        <Route path="/explore" element={
          <PageTransition>
            <Explore />
          </PageTransition>
        } />
        
        {/* Fix for external links/params trying to route to stories-rail */}
        <Route path="/stories-rail" element={<Navigate to="/" replace state={{ scrollTo: 'stories-rail' }} />} />
        <Route path="/stories-rail/" element={<Navigate to="/" replace state={{ scrollTo: 'stories-rail' }} />} />
        
        {/* Protected Routes */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <Profile />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/:userId" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <Profile />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <Analytics />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <Messages />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const AppContent: React.FC = () => {
  const { isLoading } = useGlobalContext();
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2500); // 2.5 seconds minimum loading time

    const safetyTimer = setTimeout(() => {
      setIsReady(true);
    }, 8000); // 8 seconds absolute maximum loading time

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && minTimePassed) {
      setIsReady(true);
    }
  }, [isLoading, minTimePassed]);

  const showLoading = !isReady;

  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999]"
        >
          <AppSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <HashRouter>
            <AppLayout>
              <AnimatedRoutes />
            </AppLayout>
          </HashRouter>
        </motion.div>
      )}
    </AnimatePresence>
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
