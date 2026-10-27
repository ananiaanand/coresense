import React from 'react';
import { motion } from 'framer-motion';
import { DeviceStatus } from '../types';
import { Activity, ShieldCheck, AlertCircle, WifiOff, Zap, PhoneCall, Volume2 } from 'lucide-react';

interface PendantDigitalTwinProps {
  status: DeviceStatus;
  battery: number;
  batteryDaysRemaining: number;
  isDataConnected: boolean;
  className?: string;
  isIncomingCall?: boolean;
  callerName?: string;
  isDeviceBatterySynced?: boolean;
  isCharging?: boolean;
}

export const PendantDigitalTwin: React.FC<PendantDigitalTwinProps> = ({
  status,
  battery,
  batteryDaysRemaining,
  isDataConnected,
  className = '',
  isIncomingCall = false,
  callerName = 'Caregiver',
  isDeviceBatterySynced = false,
  isCharging = false,
}) => {
  // Status color mapper
  const getStatusDetails = () => {
    if (isIncomingCall) {
      return {
        color: '#E57373',
        glow: 'rgba(229, 115, 115, 0.7)',
        label: 'SOS SIREN ACTIVE',
        icon: PhoneCall,
        subtext: `Incoming call from ${callerName} • Speaker at 85dB`,
      };
    }
    switch (status) {
      case 'alert':
        return {
          color: '#E57373',
          glow: 'rgba(229, 115, 115, 0.45)',
          label: 'CRITICAL ALERT',
          icon: AlertCircle,
          subtext: 'High-G Impact / Boundary Alert',
        };
      case 'warning':
        return {
          color: '#F0A9A0',
          glow: 'rgba(240, 169, 160, 0.4)',
          label: 'ATTENTION NEEDED',
          icon: Activity,
          subtext: 'Unusual Telemetry Anomaly',
        };
      case 'offline':
        return {
          color: '#8E8585',
          glow: 'rgba(142, 133, 133, 0.2)',
          label: 'DISCONNECTED',
          icon: WifiOff,
          subtext: 'Awaiting Cellular Ping',
        };
      case 'safe':
      default:
        return {
          color: '#9CCDB0',
          glow: 'rgba(156, 205, 176, 0.35)',
          label: 'NOMINAL / SAFE',
          icon: ShieldCheck,
          subtext: 'On-Device Edge ML Steady',
        };
    }
  };

  const details = getStatusDetails();
  const Icon = details.icon;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Necklace Chain Visual */}
      <div className="relative w-36 h-12 flex justify-center overflow-hidden">
        <svg
          viewBox="0 0 140 50"
          className="w-full h-full stroke-muted-dark/40"
          fill="none"
          strokeWidth="2.5"
          strokeDasharray="4 4"
        >
          <path d="M10 0 C 40 45, 100 45, 130 0" />
        </svg>
        <div className="absolute bottom-1 w-2.5 h-2.5 rounded-full bg-accent-peach/60 shadow-sm" />
      </div>

      {/* Neumorphic Hexagonal Device Container */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Acoustic Soundwave Ripples for Loud SOS Siren */}
        {isIncomingCall && (
          <>
            <motion.div
              animate={{ scale: [1, 1.4, 1.85], opacity: [0.7, 0.35, 0] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'easeOut' }}
              className="absolute w-56 h-56 rounded-full border-2 border-status-alert pointer-events-none z-0"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1.65], opacity: [0.8, 0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.1, delay: 0.3, ease: 'easeOut' }}
              className="absolute w-56 h-56 rounded-full border-2 border-accent-peach pointer-events-none z-0"
            />
          </>
        )}

        {/* Soft Ambient Background Glow */}
        <motion.div
          animate={{
            scale: isIncomingCall ? [1, 1.25, 1] : status === 'alert' ? [1, 1.15, 1] : status === 'warning' ? [1, 1.08, 1] : 1,
            opacity: isIncomingCall ? [0.6, 0.9, 0.6] : status === 'alert' ? [0.4, 0.7, 0.4] : 0.3,
          }}
          transition={{
            repeat: Infinity,
            duration: isIncomingCall ? 0.6 : status === 'alert' ? 1.2 : 2.5,
            ease: 'easeInOut',
          }}
          style={{
            backgroundColor: details.color,
            filter: 'blur(36px)',
          }}
          className="absolute w-44 h-44 rounded-full pointer-events-none"
        />

        {/* Outer Hexagon Shell with Neumorphic Shadows */}
        <motion.div
          animate={isIncomingCall ? { rotate: [-1, 1, -1, 1, 0], scale: [1, 1.02, 1] } : {}}
          transition={isIncomingCall ? { repeat: Infinity, duration: 0.45 } : {}}
          className="relative w-56 h-56 flex items-center justify-center transition-all duration-500 rounded-3xl z-10"
          style={{
            background: 'linear-gradient(145deg, #352E30, #2B2628)',
            boxShadow: '12px 12px 24px #1A1617, -12px -12px 24px #3C3437',
          }}
        >
          {/* LED Ring SVG */}
          <svg viewBox="0 0 200 200" className="w-48 h-48 absolute">
            <defs>
              <filter id="ledGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Ring Track */}
            <circle
              cx="100"
              cy="100"
              r="76"
              fill="none"
              stroke="#241F20"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Pulsing Active LED Ring */}
            <motion.circle
              cx="100"
              cy="100"
              r="76"
              fill="none"
              stroke={details.color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={status === 'offline' ? '6 8' : '480'}
              filter="url(#ledGlow)"
              animate={{
                opacity: status === 'alert' ? [0.5, 1, 0.5] : [0.8, 1, 0.8],
                strokeWidth: status === 'alert' ? [8, 11, 8] : 9,
              }}
              transition={{
                repeat: Infinity,
                duration: status === 'alert' ? 1.0 : 2.2,
                ease: 'easeInOut',
              }}
            />
          </svg>

          {/* Inner Cream Disc (Brand site design target: cream #FAF8F4) */}
          <div
            className="relative w-32 h-32 rounded-full flex flex-col items-center justify-center p-3 text-center transition-transform duration-300"
            style={{
              background: '#FAF8F4',
              boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.15), inset -4px -4px 8px rgba(255, 255, 255, 0.8)',
            }}
          >
            {/* CoreSense Branding & Heart Pulse */}
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] font-bold tracking-widest text-[#2A2527]/70 uppercase">
                CORESENSE
              </span>
            </div>

            <Icon
              className="w-7 h-7 mb-1 transition-colors duration-300"
              style={{ color: details.color }}
            />

            <span
              className="text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase"
              style={{
                backgroundColor: `${details.color}25`,
                color: details.color === '#FAF8F4' ? '#2A2527' : details.color,
              }}
            >
              {details.label}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Hardware Telemetry Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-dark border border-white/5 shadow-neu-sm-dark transition-all"
          title={isDeviceBatterySynced ? "Live host machine battery level synchronized" : "Simulated battery level"}
        >
          <Zap className={`w-3.5 h-3.5 ${isCharging ? 'text-status-safe animate-pulse' : 'text-accent-peach'}`} />
          <span className="text-primary-dark font-medium">{battery}%</span>
          {isCharging && <span className="text-[10px] text-status-safe font-bold">⚡</span>}
          <span className="text-muted-dark text-[11px]">({batteryDaysRemaining}d)</span>
          {isDeviceBatterySynced && (
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-status-safe/15 text-status-safe font-extrabold border border-status-safe/30">
              Device Synced
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-dark border border-white/5 shadow-neu-sm-dark">
          <span
            className={`w-2 h-2 rounded-full ${
              isDataConnected ? 'bg-status-safe' : 'bg-status-warning animate-ping'
            }`}
          />
          <span className="text-primary-dark font-medium">
            {isDataConnected ? '4G LTE' : 'SMS Backup Active'}
          </span>
        </div>
      </div>
    </div>
  );
};
