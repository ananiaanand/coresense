import React from 'react';
import { Laptop, Smartphone, Split, Radio, Sparkles, Shield, ChevronRight, Play, BookOpen } from 'lucide-react';

interface HomeSelectorProps {
  onSelectRoute: (route: string) => void;
}

export const HomeSelectorView: React.FC<HomeSelectorProps> = ({ onSelectRoute }) => {
  return (
    <div className="min-h-screen bg-base-dark text-primary-dark font-sans flex flex-col justify-between p-6 md:p-12 selection:bg-accent-peach selection:text-base-dark">
      {/* Brand Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-surface-dark shadow-neu-flat-dark flex items-center justify-center border border-white/10">
            <Radio className="w-6 h-6 text-accent-peach animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary-dark">
              CORESENSE
            </h1>
            <p className="text-xs text-muted-dark font-semibold">
              Live Pitch Demo Simulation Platform
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-surface-dark border border-white/5 text-status-safe">
          ● Ready to Present
        </span>
      </header>

      {/* Main Showcase Hero */}
      <main className="max-w-5xl mx-auto w-full my-auto py-10 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-peach/15 border border-accent-peach/30 text-accent-peach text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dementia Care Simulation</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tight leading-tight">
            A Little Pendant. <br />
            <span className="text-accent-peach">A Little More Peace of Mind.</span>
          </h2>

          <p className="text-sm md:text-base text-muted-dark leading-relaxed">
            Choose your pitch demonstration mode below. Experience instant cross-device telemetry
            sync between the wearer&apos;s necklace and the family caregiver&apos;s phone.
          </p>
        </div>

        {/* 3 Core Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Option 1: Simulator (Laptop) */}
          <div
            onClick={() => onSelectRoute('/simulator')}
            className="group cursor-pointer p-6 rounded-4xl bg-surface-dark border border-white/5 shadow-neu-flat-dark hover:border-accent-peach/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-base-dark flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Laptop className="w-7 h-7 text-accent-peach" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent-peach">
                  Interface A (Laptop)
                </span>
                <h3 className="text-xl font-bold text-primary-dark">
                  Hardware Simulator
                </h3>
                <p className="text-xs text-muted-dark leading-relaxed">
                  Controls the pendant digital twin, 8 scenario buttons, time slider, battery target,
                  and displays live pairing QR code.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-accent-peach">
              <span>Launch Simulator</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option 2: Caregiver App (Phone) */}
          <div
            onClick={() => onSelectRoute('/app')}
            className="group cursor-pointer p-6 rounded-4xl bg-surface-dark border border-white/5 shadow-neu-flat-dark hover:border-status-safe/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-base-dark flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Smartphone className="w-7 h-7 text-status-safe" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-status-safe">
                  Interface B (Mobile Phone)
                </span>
                <h3 className="text-xl font-bold text-primary-dark">
                  Caregiver Mobile PWA
                </h3>
                <p className="text-xs text-muted-dark leading-relaxed">
                  Mobile view for family. Updates in real time with vibration, audio chimes,
                  full-screen alert overlay, safe zones, and SMS fallback.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-status-safe">
              <span>Launch Caregiver View</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option 3: Split Demo (Single Screen) */}
          <div
            onClick={() => onSelectRoute('/demo')}
            className="group cursor-pointer p-6 rounded-4xl bg-surface-dark border border-accent-peach/30 shadow-neu-flat-dark hover:border-accent-peach hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent-peach text-base-dark text-[10px] font-extrabold uppercase">
              Recommended Pitch Mode
            </div>

            <div className="space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-base-dark flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Split className="w-7 h-7 text-accent-peach" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent-peach">
                  Dual-Screen in One
                </span>
                <h3 className="text-xl font-bold text-primary-dark">
                  Split Pitch Demo
                </h3>
                <p className="text-xs text-muted-dark leading-relaxed">
                  Both interfaces on a single screen! Laptop simulator on the left and interactive
                  iPhone 15 frame on the right. Perfect for offline pitches.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-accent-peach">
              <span>Launch Split Demo</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Pitch Script Quick Reference */}
        <div className="p-6 rounded-4xl bg-surface-dark/60 border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-accent-peach uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Recommended Live Pitch Demo Sequence</span>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-dark pt-1">
            <li className="p-3 rounded-2xl bg-base-dark/50 border border-white/5">
              <span className="font-bold text-primary-dark block mb-1">1. Nominal Rest</span>
              Show the calm green LED ring & 5-7 day battery target.
            </li>
            <li className="p-3 rounded-2xl bg-base-dark/50 border border-white/5">
              <span className="font-bold text-primary-dark block mb-1">2. Fall Trigger</span>
              Click &quot;Fall detected&quot; → phone chimes & pulses red within &lt;1s.
            </li>
            <li className="p-3 rounded-2xl bg-base-dark/50 border border-white/5">
              <span className="font-bold text-primary-dark block mb-1">3. Wandering Geofence</span>
              Demonstrate safe garden at noon turning restricted at 2 AM.
            </li>
            <li className="p-3 rounded-2xl bg-base-dark/50 border border-white/5">
              <span className="font-bold text-primary-dark block mb-1">4. SMS Backup</span>
              Show cellular drop & auto-switch to realistic SMS bubble.
            </li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-8 border-t border-white/5 text-center text-xs text-muted-dark">
        <p>
          Coresense is in the prototype stage. Features and battery life are design targets and
          will be confirmed in field pilots. DPDP Act 2023 Compliant.
        </p>
      </footer>
    </div>
  );
};
