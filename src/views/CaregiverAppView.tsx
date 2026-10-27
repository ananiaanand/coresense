import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PendantState,
  AlertEvent,
  CaregiverAckPayload,
  DeviceStatus,
} from '../types';
import { INITIAL_STATE, SAFE_ZONES, formatTimeOfDay } from '../services/data';
import { createRealtimeClient, RealtimeClient, ConnectionState } from '../services/realtime';
import { translations, Language } from '../services/i18n';
import { KeralaMap } from '../components/KeralaMap';
import { soundEffects } from '../services/sound';
import { triggerVibration } from '../services/vibration';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  Battery,
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  Bell,
  Home,
  Layers,
  Settings,
  MessageSquare,
  Volume2,
  VolumeX,
  Radio,
  ChevronRight,
  ExternalLink,
  Shield,
  Check,
  PhoneOff,
  PhoneCall,
} from 'lucide-react';

interface CaregiverAppViewProps {
  roomCodeFromQuery?: string;
  isEmbeddedFrame?: boolean; // if rendered inside Split Demo
}

type TabType = 'home' | 'alerts' | 'zones' | 'settings';

export const CaregiverAppView: React.FC<CaregiverAppViewProps> = ({
  roomCodeFromQuery = '8492',
  isEmbeddedFrame = false,
}) => {
  const [lang, setLang] = useState<Language>('en');
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [roomCode, setRoomCode] = useState<string>(roomCodeFromQuery);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('connecting');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [state, setState] = useState<PendantState>({
    ...INITIAL_STATE,
    roomCode: roomCodeFromQuery,
  });
  const [activeAlert, setActiveAlert] = useState<AlertEvent | null>(null);
  const [showCallConfirm, setShowCallConfirm] = useState(false);
  const [lastAckMessage, setLastAckMessage] = useState<string | null>(null);
  const [isCallingWearer, setIsCallingWearer] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [callEndedNotice, setCallEndedNotice] = useState<string | null>(null);

  const clientRef = React.useRef<RealtimeClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = createRealtimeClient();
  }
  const realtime = clientRef.current;

  const t = translations[lang];

  // Update room code if query changes
  useEffect(() => {
    if (roomCodeFromQuery && roomCodeFromQuery !== roomCode) {
      setRoomCode(roomCodeFromQuery);
    }
  }, [roomCodeFromQuery]);

  // Realtime subscription
  useEffect(() => {
    realtime.joinRoom(roomCode, 'phone', {
      onMessage: (msg) => {
        if (msg.type === 'STATE_SYNC') {
          setState(msg.payload);
          if (msg.payload.activeAlert) {
            triggerIncomingAlert(msg.payload.activeAlert);
          } else {
            setActiveAlert(null);
          }
        } else if (msg.type === 'ALERT_TRIGGERED') {
          triggerIncomingAlert(msg.payload);
        } else if (msg.type === 'END_CALL') {
          setIsCallingWearer(false);
          setCallEndedNotice(lang === 'en' ? 'Pendant silenced / call ended' : 'ലോക്കറ്റിൽ സൈറൺ നിർത്തി');
          setTimeout(() => setCallEndedNotice(null), 4000);
        }
      },
      onConnectionChange: (status) => {
        setConnectionStatus(status);
      },
    });

    return () => {
      realtime.leaveRoom();
    };
  }, [roomCode, soundEnabled, lang]);

  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Auto-unlock audio on user tap
  useEffect(() => {
    const handleUnlock = () => {
      soundEffects.unlockAudio();
      setAudioUnlocked(true);
    };
    window.addEventListener('click', handleUnlock, { once: true });
    window.addEventListener('touchstart', handleUnlock, { once: true });
    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
    };
  }, []);

  // Outgoing phone ringing cadence simulation on caregiver device
  useEffect(() => {
    let timer: number | null = null;
    if (isCallingWearer) {
      timer = window.setInterval(() => {
        setCallSeconds((s) => {
          if (s % 3 === 0 && soundEnabled) {
            soundEffects.playOutgoingRing();
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallingWearer, soundEnabled]);

  // Handle incoming alert with audio and vibration
  const triggerIncomingAlert = (alert: AlertEvent) => {
    setActiveAlert(alert);

    // Vibration
    if (alert.severity === 'critical') {
      triggerVibration([300, 150, 300, 150, 500]);
    } else {
      triggerVibration([200, 100, 200]);
    }

    // High-priority audio feedback with increased volume based on pitch simulation
    if (soundEnabled) {
      soundEffects.unlockAudio();
      if (alert.scenario === 'fall_detected') {
        soundEffects.playFallAlert();
      } else if (alert.scenario === 'wandering') {
        soundEffects.playWanderingAlert();
      } else if (alert.scenario === 'night_movement') {
        soundEffects.playNightMovementAlert();
      } else if (alert.scenario === 'pendant_removed') {
        soundEffects.playPendantRemovedAlert();
      } else if (alert.isSmsBackup) {
        soundEffects.playSmsNotification();
      } else if (alert.severity === 'critical') {
        soundEffects.playEmergencyChime();
      } else if (alert.severity === 'warning') {
        soundEffects.playWarningTone();
      }
    }
  };

  // Acknowledge Alert (Sends response back to simulator, transitions to call wearer option)
  const handleAcknowledge = () => {
    if (!activeAlert) return;

    soundEffects.playAcknowledgeChime();

    const ackPayload: CaregiverAckPayload = {
      alertId: activeAlert.id,
      timestamp: Date.now(),
      caregiverName: 'Ananya (Family Caregiver)',
      actionTaken: 'acknowledged',
    };

    // Send callback to simulator
    realtime.sendMessage({
      type: 'CAREGIVER_ACK',
      payload: ackPayload,
    });

    // Mark locally acknowledged - Keep modal open so caregiver can follow up by calling wearer!
    setActiveAlert((prev) =>
      prev
        ? {
            ...prev,
            acknowledged: true,
            acknowledgedAt: Date.now(),
            acknowledgedBy: 'Ananya (Family Caregiver)',
          }
        : null
    );
    setState((prev) => ({
      ...prev,
      lastCaregiverAck: ackPayload,
      activeAlert: prev.activeAlert
        ? {
            ...prev.activeAlert,
            acknowledged: true,
            acknowledgedAt: Date.now(),
            acknowledgedBy: 'Ananya (Family Caregiver)',
          }
        : null,
      history: prev.history.map((item) =>
        item.id === activeAlert.id
          ? {
              ...item,
              acknowledged: true,
              acknowledgedAt: Date.now(),
              acknowledgedBy: 'Ananya (Family Caregiver)',
            }
          : item
      ),
    }));

    setLastAckMessage(t.actions.acknowledgedSuccess);
  };

  // Trigger Wearer Emergency Call (Sends signal to simulator device to trigger large SOS alarm!)
  const handleTriggerWearerCall = () => {
    soundEffects.unlockAudio();
    setIsCallingWearer(true);
    setCallSeconds(0);
    setShowCallConfirm(false);

    if (soundEnabled) {
      soundEffects.playOutgoingRing();
    }

    // Realtime broadcast to simulation running device to start the large SOS alarm!
    realtime.sendMessage({
      type: 'CALL_WEARER',
      payload: {
        caller: 'Ananya (Family Caregiver)',
        timestamp: Date.now(),
        alertId: activeAlert?.id,
        isSosAlarm: true,
      },
    });

    realtime.sendMessage({
      type: 'CAREGIVER_ACK',
      payload: {
        alertId: activeAlert?.id || 'manual-call',
        timestamp: Date.now(),
        caregiverName: 'Ananya (Family Caregiver)',
        actionTaken: 'called',
      },
    });
  };

  const handleEndWearerCall = () => {
    setIsCallingWearer(false);
    realtime.sendMessage({
      type: 'END_CALL',
      payload: {
        endedBy: 'caregiver',
        timestamp: Date.now(),
      },
    });
  };

  // Open Google Maps navigation
  const handleNavigate = () => {
    const { lat, lng } = state.location;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Trigger Phone Call confirmation dialog
  const handleCall = () => {
    handleTriggerWearerCall();
  };

  const executeCall = () => {
    setShowCallConfirm(false);
    handleTriggerWearerCall();
  };

  // Battery days calculation
  const batteryPercent = state.battery;
  const batteryDays = state.batteryDaysRemaining;

  return (
    <div
      className={`relative min-h-screen bg-base-dark text-primary-dark font-sans flex flex-col justify-between overflow-x-hidden ${
        isEmbeddedFrame ? 'max-w-md mx-auto shadow-2xl rounded-[40px]' : ''
      }`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
      }}
    >
      {/* Top Mobile Status Header */}
      <header className="sticky top-0 z-40 bg-base-dark/95 backdrop-blur-md px-5 pt-4 pb-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-surface-dark shadow-neu-sm-dark flex items-center justify-center border border-white/5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-status-safe shadow-[0_0_8px_#9CCDB0]'
                  : 'bg-accent-peach animate-ping'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-primary-dark">
                CORESENSE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-dark text-muted-dark border border-white/5">
                #{roomCode}
              </span>
            </div>
            <p className="text-[10px] text-muted-dark">
              {connectionStatus === 'connected'
                ? t.actions.connected
                : t.actions.waitingPhone}
            </p>
          </div>
        </div>

        {/* Header Controls: Sound & Language Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundEffects.unlockAudio();
              setAudioUnlocked(true);
              if (next) {
                soundEffects.playAcknowledgeChime();
              }
            }}
            className="w-8 h-8 rounded-full bg-surface-dark shadow-neu-sm-dark flex items-center justify-center text-muted-dark hover:text-primary-dark border border-white/5 transition-transform active:scale-95"
            title={soundEnabled ? 'Mute alert sounds' : 'Enable loud alert sounds'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-accent-peach" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-dark" />
            )}
          </button>

          <div className="flex items-center rounded-full bg-surface-dark p-0.5 border border-white/5 shadow-neu-sm-dark">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                lang === 'en'
                  ? 'bg-accent-peach text-base-dark'
                  : 'text-muted-dark hover:text-primary-dark'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ml')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                lang === 'ml'
                  ? 'bg-accent-peach text-base-dark'
                  : 'text-muted-dark hover:text-primary-dark'
              }`}
            >
              മല
            </button>
          </div>
        </div>
      </header>

      {/* Audio Unlock Banner for Mobile Browsers */}
      {!audioUnlocked && (
        <div
          onClick={() => {
            soundEffects.unlockAudio();
            soundEffects.playAcknowledgeChime();
            setAudioUnlocked(true);
          }}
          className="bg-accent-peach/15 border-b border-accent-peach/30 px-5 py-2 flex items-center justify-between text-xs text-accent-peach cursor-pointer hover:bg-accent-peach/25 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 animate-pulse text-accent-peach" />
            <span className="font-semibold text-[11px]">
              Tap anywhere to unlock loud audio alarms on phone
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-peach text-base-dark">
            Enable
          </span>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-grow px-5 py-4 pb-24 overflow-y-auto">
        {/* TAB 1: HOME */}
        {currentTab === 'home' && (
          <div className="space-y-4">
            {/* Primary Wearer Card */}
            <div className="p-5 rounded-4xl bg-surface-dark border border-white/5 shadow-neu-flat-dark relative overflow-hidden">
              {/* Background Status Tint */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-20 filter blur-2xl"
                style={{
                  backgroundColor:
                    state.status === 'alert'
                      ? '#E57373'
                      : state.status === 'warning'
                      ? '#F0A9A0'
                      : '#9CCDB0',
                }}
              />

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FAF8F4] flex items-center justify-center shadow-md border-2 border-white/20">
                    <span className="text-xl font-bold text-[#2A2527]">ക</span>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-primary-dark">
                      {lang === 'en' ? state.wearerName.en : state.wearerName.ml}
                    </h2>
                    <span className="text-[11px] text-muted-dark font-medium">
                      Mother • Age 78 • Irinjalakuda
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                  style={{
                    backgroundColor:
                      state.status === 'alert'
                        ? 'rgba(229, 115, 115, 0.2)'
                        : state.status === 'warning'
                        ? 'rgba(240, 169, 160, 0.2)'
                        : 'rgba(156, 205, 176, 0.2)',
                    color:
                      state.status === 'alert'
                        ? '#E57373'
                        : state.status === 'warning'
                        ? '#F0A9A0'
                        : '#9CCDB0',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        state.status === 'alert'
                          ? '#E57373'
                          : state.status === 'warning'
                          ? '#F0A9A0'
                          : '#9CCDB0',
                    }}
                  />
                  <span>
                    {state.status === 'alert'
                      ? t.statusAlert
                      : state.status === 'warning'
                      ? t.statusWarning
                      : t.statusSafe}
                  </span>
                </div>
              </div>

              {/* Safe Zone & Last Seen Info */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5 text-xs">
                <div className="p-2.5 rounded-2xl bg-base-dark/50 border border-white/5">
                  <span className="text-[10px] text-muted-dark uppercase font-bold block mb-0.5">
                    {t.currentZone}
                  </span>
                  <span className="font-bold text-primary-dark line-clamp-1">
                    {lang === 'en' ? state.currentZone.name_en : state.currentZone.name_ml}
                  </span>
                  <span className="text-[10px] text-status-safe font-medium">
                    {state.currentZone.isSafeNow ? `✓ ${t.inSafeZone}` : `⚠ ${t.outsideSafeZone}`}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-base-dark/50 border border-white/5">
                  <span className="text-[10px] text-muted-dark uppercase font-bold block mb-0.5">
                    {t.lastSeenJustNow}
                  </span>
                  <span className="font-bold text-primary-dark">
                    {formatTimeOfDay(state.timeOfDay)}
                  </span>
                  <span className="text-[10px] text-muted-dark block">
                    {state.isDataConnected ? '4G LTE Telemetry' : 'SMS Backup Link'}
                  </span>
                </div>
              </div>
            </div>

            {/* Battery & Health Indicators */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Battery Card */}
              <div className="p-4 rounded-3xl bg-surface-dark border border-white/5 shadow-neu-flat-dark flex items-center gap-3">
                {/* Circular Battery Progress */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="19"
                      stroke="#241F20"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="19"
                      stroke={batteryPercent < 20 ? '#F0A9A0' : '#9CCDB0'}
                      strokeWidth="4"
                      strokeDasharray="119"
                      strokeDashoffset={119 - (119 * batteryPercent) / 100}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-primary-dark font-mono">
                    {batteryPercent}%
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-dark block">
                    Pendant Battery
                  </span>
                  <span className="text-xs font-bold text-primary-dark">
                    {batteryDays} {t.batteryRemaining}
                  </span>
                  <span className="text-[9px] text-muted-dark block">
                    5-7 day design target
                  </span>
                </div>
              </div>

              {/* Cellular Connectivity Card */}
              <div className="p-4 rounded-3xl bg-surface-dark border border-white/5 shadow-neu-flat-dark flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-base-dark flex items-center justify-center shrink-0 shadow-inner">
                  <Radio
                    className={`w-5 h-5 ${
                      state.isDataConnected ? 'text-status-safe' : 'text-accent-peach animate-pulse'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-dark block">
                    Network Status
                  </span>
                  <span className="text-xs font-bold text-primary-dark">
                    {state.isDataConnected ? 'Encrypted 4G' : 'SMS Fallback'}
                  </span>
                  <span className="text-[9px] text-muted-dark block">
                    {state.isDataConnected ? 'Airtel IoT SIM' : 'Direct SMS active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Location Map */}
            <div className="p-4 rounded-4xl bg-surface-dark border border-white/5 shadow-neu-flat-dark space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent-peach" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-dark">
                    Live GPS Telemetry
                  </span>
                </div>
                <span className="text-[11px] font-mono text-status-safe">
                  Irinjalakuda, Kerala
                </span>
              </div>

              <KeralaMap
                location={state.location}
                status={state.status}
                timeOfDay={state.timeOfDay}
                interactive={false}
                className="h-52 w-full rounded-2xl border border-white/5"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-dark">
                  {state.location.label}
                </span>
                <button
                  onClick={handleNavigate}
                  className="px-3 py-1 rounded-full bg-base-dark border border-white/10 text-xs font-semibold text-accent-peach flex items-center gap-1 shadow-neu-sm-dark active:shadow-neu-pressed-dark"
                >
                  <Navigation className="w-3 h-3" />
                  <span>{t.actions.navigate}</span>
                </button>
              </div>
            </div>

            {/* Quick Contact Wearer / Neighbor Action Bar */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleCall}
                className="flex-1 py-3 px-4 rounded-3xl bg-accent-peach text-base-dark font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                <Phone className="w-4 h-4" />
                <span>{t.actions.call}</span>
              </button>
              <button
                onClick={handleNavigate}
                className="flex-1 py-3 px-4 rounded-3xl bg-surface-dark border border-white/10 text-primary-dark font-bold text-xs flex items-center justify-center gap-2 shadow-neu-flat-dark active:shadow-neu-pressed-dark"
              >
                <Navigation className="w-4 h-4 text-accent-peach" />
                <span>{t.actions.navigate}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ALERTS FEED */}
        {currentTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <h2 className="text-sm font-extrabold text-primary-dark">
                  {lang === 'en' ? 'Pendant Telemetry Feed' : 'അറിയിപ്പുകളുടെ പട്ടിക'}
                </h2>
                <p className="text-[11px] text-muted-dark">
                  Historical telemetry and incident timeline
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-dark text-muted-dark">
                {state.history.length} Events
              </span>
            </div>

            <div className="space-y-3">
              {state.history.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-3xl bg-surface-dark border border-white/5 shadow-neu-flat-dark space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          event.severity === 'critical'
                            ? 'rgba(229, 115, 115, 0.2)'
                            : event.severity === 'warning'
                            ? 'rgba(240, 169, 160, 0.2)'
                            : 'rgba(156, 205, 176, 0.2)',
                        color:
                          event.severity === 'critical'
                            ? '#E57373'
                            : event.severity === 'warning'
                            ? '#F0A9A0'
                            : '#9CCDB0',
                      }}
                    >
                      {event.severity.toUpperCase()}
                    </span>

                    <span className="text-[10px] font-mono text-muted-dark">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-primary-dark">
                    {lang === 'en' ? event.title_en : event.title_ml}
                  </h3>

                  <p className="text-xs text-muted-dark leading-relaxed">
                    {lang === 'en' ? event.description_en : event.description_ml}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                    <span className="text-muted-dark">
                      Zone: {event.safeZoneName}
                    </span>
                    {event.acknowledged ? (
                      <span className="text-status-safe font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {lang === 'en' ? 'Acknowledged' : 'സ്വീകരിച്ചു'}
                      </span>
                    ) : (
                      <span className="text-accent-peach font-semibold">
                        {lang === 'en' ? 'Unacknowledged' : 'ശ്രദ്ധിക്കുക'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SAFE ZONES */}
        {currentTab === 'zones' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-white/5">
              <h2 className="text-sm font-extrabold text-primary-dark">
                {lang === 'en' ? 'Adaptive Safe Zones' : 'സുരക്ഷിത മേഖലകൾ'}
              </h2>
              <p className="text-[11px] text-muted-dark">
                Safe zones adjust automatically based on simulated time of day
              </p>
            </div>

            <div className="space-y-3">
              {SAFE_ZONES.map((zone) => {
                const isSafeNow = zone.id === 'garden'
                  ? state.timeOfDay >= 8 && state.timeOfDay <= 18
                  : true;

                return (
                  <div
                    key={zone.id}
                    className="p-4 rounded-3xl bg-surface-dark border border-white/5 shadow-neu-flat-dark space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-primary-dark">
                        {lang === 'en' ? zone.name_en : zone.name_ml}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSafeNow
                            ? 'bg-status-safe/20 text-status-safe'
                            : 'bg-accent-peach/20 text-accent-peach'
                        }`}
                      >
                        {isSafeNow
                          ? lang === 'en'
                            ? 'Active Now'
                            : 'സജീവം'
                          : lang === 'en'
                          ? 'Restricted'
                          : 'നിയന്ത്രിതം'}
                      </span>
                    </div>

                    <p className="text-xs text-muted-dark">
                      {lang === 'en' ? zone.description_en : zone.description_ml}
                    </p>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-dark">
                      <span>Radius: {zone.radiusMeters}m perimeter</span>
                      <span className="font-mono text-primary-dark">
                        {zone.allowedHoursStart}:00 – {zone.allowedHoursEnd}:00
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS & PRIVACY */}
        {currentTab === 'settings' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-white/5">
              <h2 className="text-sm font-extrabold text-primary-dark">
                {lang === 'en' ? 'Pendant Specifications & Privacy' : 'വിവരങ്ങളും സ്വകാര്യതയും'}
              </h2>
              <p className="text-[11px] text-muted-dark">
                Hardware design targets and regulatory compliance
              </p>
            </div>

            {/* Privacy Card */}
            <div className="p-4 rounded-3xl bg-surface-dark border border-white/5 shadow-neu-flat-dark space-y-2">
              <div className="flex items-center gap-2 text-status-safe font-bold text-xs uppercase">
                <Shield className="w-4 h-4" />
                <span>India DPDP Act 2023 Compliant</span>
              </div>
              <p className="text-xs text-muted-dark leading-relaxed">
                {t.dpdpDetails}
              </p>
            </div>

            {/* Battery Spec Card */}
            <div className="p-4 rounded-3xl bg-surface-dark border border-white/5 shadow-neu-flat-dark space-y-2">
              <div className="flex items-center gap-2 text-accent-peach font-bold text-xs uppercase">
                <Battery className="w-4 h-4" />
                <span>Battery & Power Architecture</span>
              </div>
              <p className="text-xs text-muted-dark leading-relaxed">
                Target design: 5 to 7 days continuous run between charges using ultra-low-power edge
                ML sleep states and event-driven cellular telemetry.
              </p>
            </div>

            {/* High-Volume Simulation Sound Test Pad */}
            <div className="p-4 rounded-3xl bg-surface-dark border border-white/5 shadow-neu-flat-dark space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-status-warning font-bold text-xs uppercase">
                  <Volume2 className="w-4 h-4 text-accent-peach" />
                  <span>High-Volume Alert Audio Test</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-base-dark text-status-safe font-semibold">
                  Boosted 0.85+
                </span>
              </div>
              <p className="text-xs text-muted-dark">
                Tap any button below to test the loud audio alarms on this device:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    soundEffects.unlockAudio();
                    soundEffects.playFallAlert();
                  }}
                  className="p-2.5 rounded-2xl bg-base-dark border border-red-500/20 text-primary-dark text-left text-xs font-bold hover:border-red-500/40 transition-colors"
                >
                  <span className="text-status-warning block text-[10px]">Fall Detected</span>
                  <span className="text-muted-dark text-[10px]">Loud Multi-Pulse Alarm</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.unlockAudio();
                    soundEffects.playWanderingAlert();
                  }}
                  className="p-2.5 rounded-2xl bg-base-dark border border-red-500/20 text-primary-dark text-left text-xs font-bold hover:border-red-500/40 transition-colors"
                >
                  <span className="text-status-warning block text-[10px]">Left Safe Zone</span>
                  <span className="text-muted-dark text-[10px]">Loud Geofence Siren</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.unlockAudio();
                    soundEffects.playNightMovementAlert();
                  }}
                  className="p-2.5 rounded-2xl bg-base-dark border border-accent-peach/20 text-primary-dark text-left text-xs font-bold hover:border-accent-peach/40 transition-colors"
                >
                  <span className="text-accent-peach block text-[10px]">Night Movement</span>
                  <span className="text-muted-dark text-[10px]">Loud Wake-up Chime</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.unlockAudio();
                    soundEffects.playPendantRemovedAlert();
                  }}
                  className="p-2.5 rounded-2xl bg-base-dark border border-accent-peach/20 text-primary-dark text-left text-xs font-bold hover:border-accent-peach/40 transition-colors"
                >
                  <span className="text-accent-peach block text-[10px]">Pendant Removed</span>
                  <span className="text-muted-dark text-[10px]">Loud Detachment Beep</span>
                </button>
              </div>
            </div>

            {/* Room Code Pairing Info */}
            <div className="p-4 rounded-3xl bg-surface-dark border border-white/5 shadow-neu-flat-dark space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-dark block">
                Active Pairing Room
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-accent-peach">
                  Room #{roomCode}
                </span>
                <span className="text-xs text-status-safe font-semibold">
                  Connected
                </span>
              </div>
            </div>

            {/* Prototype Disclaimer */}
            <div className="p-4 rounded-2xl bg-base-dark/50 border border-white/5 text-center">
              <p className="text-[11px] text-muted-dark italic">
                &quot;{t.prototypeDisclaimer}&quot;
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FULL-SCREEN ALERT OVERLAY */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-0 z-[9999] bg-[#2A2527] flex flex-col justify-between p-4 sm:p-6 overflow-y-auto"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-mono font-bold text-accent-peach px-2.5 py-0.5 rounded-full bg-surface-dark border border-white/10">
                CORESENSE TELEMETRY
              </span>
              <span className="text-[11px] text-muted-dark">
                {new Date(activeAlert.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Central Animated Alert Core */}
            <div className="my-auto flex flex-col items-center text-center space-y-3 py-2">
              {/* SPECIAL CASE: SMS BACKUP VIEW */}
              {activeAlert.isSmsBackup ? (
                <div className="w-full max-w-sm space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-info/20 text-status-info text-xs font-bold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.smsAlert.badge}</span>
                  </div>

                  {/* Styled SMS Bubble */}
                  <div className="p-4 rounded-3xl bg-surface-dark border border-white/10 shadow-neu-flat-dark text-left space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-dark font-mono pb-1.5 border-b border-white/5">
                      <span>From: {t.smsAlert.sender}</span>
                      <span>Carrier: BSNL/Airtel</span>
                    </div>
                    <p className="text-xs text-primary-dark font-mono leading-relaxed">
                      {lang === 'en' ? t.smsAlert.body : t.smsAlert.body}
                    </p>
                    <div className="text-[10px] text-muted-dark pt-0.5">
                      * Received via cellular SMS modem fallback (No 4G/WiFi required)
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Pulsing Emergency Ring */
                <div className="flex flex-col items-center space-y-3">
                  {/* Neumorphic Pulsing Ring */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.6, 0.1, 0.6],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor:
                          activeAlert.severity === 'critical' ? '#E57373' : '#F0A9A0',
                      }}
                    />

                    <div
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-2xl"
                      style={{
                        backgroundColor: '#302A2C',
                        boxShadow: '6px 6px 14px #1F1B1C, -6px -6px 14px #382F32',
                      }}
                    >
                      <AlertCircle
                        className="w-11 h-11 transition-transform"
                        style={{
                          color:
                            activeAlert.severity === 'critical' ? '#E57373' : '#F0A9A0',
                        }}
                      />
                    </div>
                  </div>

                  {/* Alert Headline & Description */}
                  <div className="space-y-1.5 max-w-xs">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          activeAlert.severity === 'critical'
                            ? 'rgba(229, 115, 115, 0.2)'
                            : 'rgba(240, 169, 160, 0.2)',
                        color:
                          activeAlert.severity === 'critical' ? '#E57373' : '#F0A9A0',
                      }}
                    >
                      {activeAlert.severity === 'critical'
                        ? 'CRITICAL INCIDENT'
                        : 'TELEMETRY WARNING'}
                    </span>

                    <h2 className="text-lg sm:text-xl font-extrabold text-primary-dark">
                      {lang === 'en' ? activeAlert.title_en : activeAlert.title_ml}
                    </h2>

                    <p className="text-xs text-muted-dark leading-relaxed">
                      {lang === 'en'
                        ? activeAlert.description_en
                        : activeAlert.description_ml}
                    </p>
                  </div>
                </div>
              )}

              {/* Success Ack Feedback */}
              {lastAckMessage && (
                <div className="p-2.5 rounded-2xl bg-status-safe/20 text-status-safe text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{lastAckMessage}</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Before Ack vs After Ack */}
            {!activeAlert.acknowledged ? (
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAcknowledge}
                  className="w-full py-3 px-4 rounded-3xl bg-accent-peach text-base-dark font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform hover:brightness-105"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.actions.acknowledge}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleTriggerWearerCall}
                    className="py-2.5 rounded-2xl bg-surface-dark border border-white/10 text-primary-dark font-bold text-xs flex items-center justify-center gap-1.5 shadow-neu-flat-dark active:shadow-neu-pressed-dark hover:border-accent-peach/30 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-accent-peach" />
                    <span>{t.actions.call}</span>
                  </button>

                  <button
                    onClick={handleNavigate}
                    className="py-2.5 rounded-2xl bg-surface-dark border border-white/10 text-primary-dark font-bold text-xs flex items-center justify-center gap-1.5 shadow-neu-flat-dark active:shadow-neu-pressed-dark"
                  >
                    <Navigation className="w-3.5 h-3.5 text-accent-peach" />
                    <span>{t.actions.navigate}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Post-Acknowledgment State: Option to Call Wearer & make large SOS sound on simulator */
              <div className="space-y-3 pt-2 animate-fadeIn">
                <div className="p-3 rounded-2xl bg-status-safe/15 border border-status-safe/30 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-status-safe">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.actions.acknowledgedSuccess}</span>
                  </div>
                  <p className="text-[11px] text-muted-dark font-medium">
                    {lang === 'en'
                      ? 'Telemetry updated in simulator. Next step: Call wearer now to verify condition.'
                      : 'സിമുലേറ്ററിലേക്ക് വിവരം കൈമാറി. കല്യാണി അമ്മയെ ഉടൻ വിളിച്ചുറപ്പ് വരുത്തുക.'}
                  </p>
                </div>

                {/* Big Prominent Call Wearer Option */}
                <button
                  onClick={handleTriggerWearerCall}
                  className="w-full py-3.5 px-4 rounded-3xl bg-gradient-to-r from-accent-peach via-status-warning to-accent-peach bg-[length:200%_auto] text-base-dark font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl hover:shadow-accent-peach/30 active:scale-98 transition-all animate-pulse"
                >
                  <div className="w-6 h-6 rounded-full bg-base-dark/20 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-base-dark" />
                  </div>
                  <span>{t.actions.callWearerSos}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleNavigate}
                    className="py-2.5 rounded-2xl bg-surface-dark border border-white/10 text-primary-dark font-bold text-xs flex items-center justify-center gap-1.5 shadow-neu-flat-dark active:shadow-neu-pressed-dark"
                  >
                    <Navigation className="w-3.5 h-3.5 text-accent-peach" />
                    <span>{t.actions.navigate}</span>
                  </button>

                  <button
                    onClick={() => setActiveAlert(null)}
                    className="py-2.5 rounded-2xl bg-surface-dark/70 border border-white/5 text-muted-dark hover:text-primary-dark font-semibold text-xs flex items-center justify-center gap-1.5 shadow-neu-sm-dark active:shadow-neu-pressed-dark transition-colors"
                  >
                    <span>{t.actions.dismiss}</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Wearer Emergency Call Overlay (Sends SOS sound to simulator device) */}
      {isCallingWearer && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm p-6 rounded-4xl bg-surface-dark border border-status-alert/40 shadow-2xl space-y-5 text-center relative overflow-hidden">
            {/* Ambient siren glow */}
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-status-alert/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-accent-peach/20 rounded-full blur-2xl pointer-events-none" />

            {/* Pulsing Acoustic Siren Icon with sound waves */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-status-alert/20 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-status-alert/30 animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-status-alert text-base-dark flex items-center justify-center shadow-lg">
                <PhoneCall className="w-7 h-7 animate-bounce" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-alert/20 border border-status-alert/30 text-status-alert text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-status-alert animate-ping" />
                <span>Pendant Intercom Active</span>
              </div>
              <h3 className="text-lg font-extrabold text-primary-dark">
                {lang === 'en' ? 'Calling Kalyani Amma' : 'കല്യാണി അമ്മയെ വിളിക്കുന്നു'}
              </h3>
              <p className="text-xs text-muted-dark mt-1 font-mono">
                {lang === 'en' ? 'Ringing pendant speaker' : 'ലോക്കറ്റ് സ്പീക്കർ മുഴങ്ങുന്നു'} •{' '}
                <span className="text-accent-peach font-bold">
                  {Math.floor(callSeconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(callSeconds % 60).toString().padStart(2, '0')}
                </span>
              </p>
            </div>

            {/* Acoustic Siren Banner Notice */}
            <div className="p-3.5 rounded-2xl bg-base-dark/80 border border-status-alert/30 text-left flex items-start gap-2.5">
              <Volume2 className="w-4 h-4 text-status-alert flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="text-[11px] space-y-0.5">
                <p className="text-primary-dark font-bold flex items-center gap-1.5">
                  <span>Large SOS Sound Triggered!</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-status-alert animate-ping" />
                </p>
                <p className="text-muted-dark leading-relaxed">
                  {lang === 'en'
                    ? 'The simulation running device is now blaring an 85dB acoustic emergency siren to alert the wearer.'
                    : 'സിമുലേഷൻ പ്രവർത്തിക്കുന്ന ഉപകരണത്തിൽ ഉച്ചത്തിലുള്ള അടിയന്തര SOS സൈറൺ മുഴങ്ങുന്നു.'}
                </p>
              </div>
            </div>

            {/* Call Controls */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleEndWearerCall}
                className="w-full py-3.5 px-4 rounded-3xl bg-status-alert text-base-dark font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform hover:brightness-105"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{t.actions.endCall}</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = 'tel:+919876543210';
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-surface-dark border border-white/10 text-muted-dark hover:text-primary-dark font-bold text-xs flex items-center justify-center gap-2 shadow-neu-sm-dark active:shadow-neu-pressed-dark"
              >
                <Phone className="w-3.5 h-3.5 text-accent-peach" />
                <span>Dial Regular Cellular (+91 98765 43210)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Ended Toast */}
      {callEndedNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2.5 rounded-full bg-surface-dark/95 border border-white/10 shadow-2xl text-xs font-bold text-primary-dark flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-status-safe" />
          <span>{callEndedNotice}</span>
        </div>
      )}

      {/* Call Confirmation Dialog */}
      {showCallConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xs p-6 rounded-4xl bg-surface-dark border border-white/10 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-status-safe/20 text-status-safe flex items-center justify-center mx-auto">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-primary-dark">
              Call Wearer / Neighbor?
            </h3>
            <p className="text-xs text-muted-dark">
              Sends emergency call to wearer device and triggers loud SOS alarm.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowCallConfirm(false)}
                className="py-2.5 rounded-2xl bg-base-dark text-muted-dark text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executeCall}
                className="py-2.5 rounded-2xl bg-status-safe text-base-dark text-xs font-bold"
              >
                Call Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="sticky bottom-0 z-40 bg-surface-dark/95 backdrop-blur-md px-6 py-2 border-t border-white/5 shadow-2xl flex items-center justify-around">
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentTab === 'home'
              ? 'text-accent-peach font-bold'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">{t.tabs.home}</span>
        </button>

        <button
          onClick={() => setCurrentTab('alerts')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentTab === 'alerts'
              ? 'text-accent-peach font-bold'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px]">{t.tabs.alerts}</span>
        </button>

        <button
          onClick={() => setCurrentTab('zones')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentTab === 'zones'
              ? 'text-accent-peach font-bold'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">{t.tabs.zones}</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentTab === 'settings'
              ? 'text-accent-peach font-bold'
              : 'text-muted-dark hover:text-primary-dark'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">{t.tabs.settings}</span>
        </button>
      </nav>
    </div>
  );
};
