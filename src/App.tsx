import React, { useState, useEffect } from 'react';
import { SimulatorView } from './views/SimulatorView';
import { CaregiverAppView } from './views/CaregiverAppView';
import { SplitDemoView } from './views/SplitDemoView';
import { HomeSelectorView } from './views/HomeSelectorView';
import { Sun, Moon, Laptop, Smartphone, Split, Home } from 'lucide-react';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (path.startsWith('/simulator') || hash.startsWith('#/simulator')) return '/simulator';
    if (path.startsWith('/app') || hash.startsWith('#/app')) return '/app';
    if (path.startsWith('/demo') || hash.startsWith('#/demo')) return '/demo';
    return '/';
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

      if (path.startsWith('/simulator') || hash.startsWith('#/simulator')) {
        setCurrentPath('/simulator');
      } else if (path.startsWith('/app') || hash.startsWith('#/app')) {
        setCurrentPath('/app');
      } else if (path.startsWith('/demo') || hash.startsWith('#/demo')) {
        setCurrentPath('/demo');
      } else {
        setCurrentPath('/');
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
      {/* Global Quick Route Switcher & Theme Toggle Floater */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-surface-dark/90 backdrop-blur-md border border-white/10 shadow-2xl">
        <button
          onClick={() => navigateTo('/')}
          className={`p-2 rounded-full transition-colors ${
            currentPath === '/'
              ? 'bg-accent-peach text-base-dark'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
          title="Home Selector"
        >
          <Home className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigateTo('/simulator')}
          className={`p-2 rounded-full transition-colors ${
            currentPath === '/simulator'
              ? 'bg-accent-peach text-base-dark'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
          title="Laptop Simulator (/simulator)"
        >
          <Laptop className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigateTo('/app')}
          className={`p-2 rounded-full transition-colors ${
            currentPath === '/app'
              ? 'bg-accent-peach text-base-dark'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
          title="Caregiver App (/app)"
        >
          <Smartphone className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigateTo('/demo')}
          className={`p-2 rounded-full transition-colors ${
            currentPath === '/demo'
              ? 'bg-accent-peach text-base-dark'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
          title="Split Demo (/demo)"
        >
          <Split className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-muted-dark hover:text-primary-dark transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-accent-peach" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Route Views */}
      {currentPath === '/simulator' && (
        <SimulatorView
          initialRoomCode={roomCode}
          onNavigateToSplit={() => navigateTo('/demo')}
        />
      )}

      {currentPath === '/app' && (
        <CaregiverAppView roomCodeFromQuery={roomCode} />
      )}

      {currentPath === '/demo' && (
        <SplitDemoView onBackToSelector={() => navigateTo('/')} />
      )}

      {currentPath === '/' && (
        <HomeSelectorView onSelectRoute={(route) => navigateTo(route)} />
      )}
    </div>
  );
}

export default App;
