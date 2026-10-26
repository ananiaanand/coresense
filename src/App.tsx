import React, { useState, useEffect } from 'react';
import { SimulatorView } from './views/SimulatorView';
import { CaregiverAppView } from './views/CaregiverAppView';
import { Sun, Moon, Laptop, Smartphone } from 'lucide-react';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/simulator';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (path.startsWith('/app') || hash.startsWith('#/app')) return '/app';
    return '/simulator';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Parse room query parameter if present (?room=XXXX or #/app?room=XXXX)
  const getRoomFromUrl = (): string => {
    if (typeof window === 'undefined') return '8492';
    const searchParams = new URLSearchParams(window.location.search);
    const room = searchParams.get('room');
    if (room) return room;

    // Check hash for room
    const hashParts = window.location.hash.split('?');
    if (hashParts.length > 1) {
      const hashParams = new URLSearchParams(hashParts[1]);
      const hashRoom = hashParams.get('room');
      if (hashRoom) return hashRoom;
    }

    return '8492';
  };

  const roomCode = getRoomFromUrl();

  // Navigation handler
  const navigateTo = (path: string, newRoom?: string) => {
    const targetRoom = newRoom || roomCode;
    let fullUrl = path;

    if (path === '/app' && targetRoom) {
      fullUrl = `${path}?room=${targetRoom}`;
    }

    window.history.pushState({}, '', fullUrl);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Listen to popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path.startsWith('/app') || hash.startsWith('#/app')) {
        setCurrentPath('/app');
      } else {
        setCurrentPath('/simulator');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Sync theme with document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#2A2527';
      document.body.style.color = '#F5EFE9';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.backgroundColor = '#F1ECE6';
      document.body.style.color = '#2A2527';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="relative min-h-screen">
      {/* Route Switcher & Theme Toggle Floater */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-surface-dark/90 backdrop-blur-md border border-white/10 shadow-2xl">
        <button
          onClick={() => navigateTo('/simulator')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            currentPath === '/simulator'
              ? 'bg-accent-peach text-base-dark shadow-sm'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
          title="Laptop Simulator (/simulator)"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Simulator</span>
        </button>

        <button
          onClick={() => navigateTo('/app')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            currentPath === '/app'
              ? 'bg-accent-peach text-base-dark shadow-sm'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
          title="Caregiver App (/app)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Caregiver App</span>
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full text-muted-dark hover:text-primary-dark transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-accent-peach" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Routes */}
      {currentPath === '/app' ? (
        <CaregiverAppView roomCodeFromQuery={roomCode} />
      ) : (
        <SimulatorView initialRoomCode={roomCode} />
      )}
    </div>
  );
}

export default App;
