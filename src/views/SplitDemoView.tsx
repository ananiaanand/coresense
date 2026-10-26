import React, { useState } from 'react';
import { SimulatorView } from './SimulatorView';
import { CaregiverAppView } from './CaregiverAppView';
import { Laptop, Smartphone, Radio, ArrowLeft, RefreshCw } from 'lucide-react';

interface SplitDemoViewProps {
  onBackToSelector?: () => void;
}

export const SplitDemoView: React.FC<SplitDemoViewProps> = ({ onBackToSelector }) => {
  const [roomCode] = useState('8492');
  const [deviceScale, setDeviceScale] = useState<number>(1);

  return (
    <div className="min-h-screen bg-[#1F1B1C] text-primary-dark flex flex-col font-sans select-none">
      {/* Top Pitch Presenter Banner */}
      <div className="bg-surface-dark px-6 py-2.5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {onBackToSelector && (
            <button
              onClick={onBackToSelector}
              className="px-2.5 py-1 rounded-full bg-base-dark text-muted-dark hover:text-primary-dark flex items-center gap-1 border border-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-safe shadow-[0_0_8px_#9CCDB0]" />
            <span className="font-extrabold tracking-wider text-primary-dark uppercase">
              CORESENSE DUAL-VIEW PITCH DEMO
            </span>
            <span className="px-2 py-0.5 rounded-full bg-accent-peach/20 text-accent-peach font-semibold text-[10px]">
              Single Screen Fallback
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-muted-dark">
          <div className="flex items-center gap-1.5">
            <Laptop className="w-4 h-4 text-accent-peach" />
            <span className="text-primary-dark font-medium">Laptop Simulator (Left)</span>
          </div>
          <span>⇄</span>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-status-safe" />
            <span className="text-primary-dark font-medium">Caregiver Phone Frame (Right)</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-base-dark text-accent-peach">
            Room #{roomCode}
          </span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-grow grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 md:p-6 overflow-hidden">
        {/* Left Side: Laptop Simulator (7 cols on XL) */}
        <div className="xl:col-span-7 bg-base-dark rounded-4xl border border-white/5 shadow-neu-flat-dark overflow-y-auto max-h-[calc(100vh-80px)]">
          <SimulatorView initialRoomCode={roomCode} />
        </div>

        {/* Right Side: Caregiver Phone Frame (5 cols on XL) */}
        <div className="xl:col-span-5 flex flex-col items-center justify-center p-2">
          {/* Realistic iPhone 15 Pro Frame */}
          <div
            className="relative w-full max-w-[380px] h-[780px] max-h-[calc(100vh-130px)] rounded-[48px] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_10px_#383134,0_0_0_12px_#231F20] bg-base-dark flex flex-col overflow-hidden border border-white/10"
          >
            {/* Dynamic Island Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-28 h-6 rounded-full bg-black flex items-center justify-between px-3 pointer-events-none">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] border border-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-peach/30" />
            </div>

            {/* Embedded Caregiver App View */}
            <div className="w-full h-full rounded-[42px] overflow-hidden flex flex-col bg-base-dark pt-4">
              <CaregiverAppView roomCodeFromQuery={roomCode} isEmbeddedFrame={true} />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-white/30 pointer-events-none" />
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-dark">
              Try clicking <strong className="text-accent-peach">&quot;Fall detected&quot;</strong> on the left,
              then tap <strong className="text-status-safe">&quot;Acknowledge&quot;</strong> on the phone!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
