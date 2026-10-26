import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  PendantState,
  ScenarioType,
  DeviceStatus,
  CaregiverAckPayload,
} from '../types';
import {
  INITIAL_STATE,
  SAFE_ZONES,
  createScenarioAlert,
} from '../services/data';
import { createRealtimeClient, RealtimeClient, ConnectionState } from '../services/realtime';
import { translations, Language } from '../services/i18n';
import { PendantDigitalTwin } from '../components/PendantDigitalTwin';
import { soundEffects } from '../services/sound';
import {
  Radio,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';

interface SimulatorViewProps {
  initialRoomCode?: string;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  initialRoomCode = '8492',
}) => {
  const [lang, setLang] = useState<Language>('en');
  const [roomCode] = useState<string>(initialRoomCode);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('waiting');
  const [state, setState] = useState<PendantState>({
    ...INITIAL_STATE,
    roomCode: initialRoomCode,
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('normal');
  const [caregiverAckNotification, setCaregiverAckNotification] = useState<CaregiverAckPayload | null>(null);
  const clientRef = React.useRef<RealtimeClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = createRealtimeClient();
  }
  const realtime = clientRef.current;

  const t = translations[lang];

  // URL for Caregiver App pairing
  const phoneAppUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/app?room=${roomCode}`
    : `https://coresense.app/app?room=${roomCode}`;

  // Join Realtime Room
  useEffect(() => {
    realtime.joinRoom(roomCode, 'simulator', {
      onMessage: (msg) => {
        if (msg.type === 'CAREGIVER_ACK') {
          soundEffects.playAcknowledgeChime();
          setCaregiverAckNotification(msg.payload);
          setState((prev) => ({
            ...prev,
            lastCaregiverAck: msg.payload,
            activeAlert: prev.activeAlert
              ? {
                  ...prev.activeAlert,
                  acknowledged: true,
                  acknowledgedAt: msg.payload.timestamp,
                  acknowledgedBy: msg.payload.caregiverName,
                }
              : null,
            history: prev.history.map((item) =>
              item.id === msg.payload.alertId
                ? {
                    ...item,
                    acknowledged: true,
                    acknowledgedAt: msg.payload.timestamp,
                    acknowledgedBy: msg.payload.caregiverName,
                  }
                : item
            ),
          }));

          // Clear acknowledgment toast after 8 seconds
          setTimeout(() => {
            setCaregiverAckNotification(null);
          }, 8000);
        } else if (msg.type === 'PHONE_JOINED') {
          setConnectionStatus('connected');
        }
      },
      onConnectionChange: (status) => {
        setConnectionStatus(status);
      },
    });

    return () => {
      realtime.leaveRoom();
    };
  }, [roomCode]);

  // Handle Scenario Click
  const handleTriggerScenario = (scenario: ScenarioType) => {
    setSelectedScenario(scenario);

    const { alert, status, isDataConnected, newLocation } = createScenarioAlert(
      scenario,
      state.battery,
      state.timeOfDay,
      state.location
    );

    const updatedLocation = newLocation || state.location;
    const currentZoneObj = SAFE_ZONES[0];

    const updatedState: PendantState = {
      ...state,
      status: status as DeviceStatus,
      isDataConnected,
      location: updatedLocation,
      activeAlert: alert,
      currentZone: {
        name_en: currentZoneObj.name_en,
        name_ml: currentZoneObj.name_ml,
        isSafeNow: scenario === 'wandering' ? false : true,
      },
      history: alert ? [alert, ...state.history] : state.history,
    };

    setState(updatedState);

    // Audio feedback
    if (scenario === 'normal') {
      soundEffects.playResetTone();
    } else if (status === 'alert') {
      soundEffects.playEmergencyChime();
    } else {
      soundEffects.playWarningTone();
    }

    // Broadcast updated state to caregiver phone
    realtime.sendMessage({
      type: 'STATE_SYNC',
      payload: updatedState,
    });
  };

  // Copy Phone Pairing Link
  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phoneAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Scenario Buttons Config
  const scenarioButtons: {
    type: ScenarioType;
    label_en: string;
    label_ml: string;
    color: string;
    bgAccent: string;
    badge: string;
  }[] = [
    {
      type: 'fall_detected',
      label_en: 'Fall detected',
      label_ml: 'വീഴ്ച തിരിച്ചറിഞ്ഞു',
      color: '#E57373',
      bgAccent: 'rgba(229, 115, 115, 0.15)',
      badge: 'Critical IMU Vector',
    },
    {
      type: 'wandering',
      label_en: 'Left safe zone (wandering)',
      label_ml: 'സുരക്ഷിത മേഖല വിട്ടു',
      color: '#E57373',
      bgAccent: 'rgba(229, 115, 115, 0.15)',
      badge: 'Geofence Breach',
    },
    {
      type: 'night_movement',
      label_en: 'Unusual night-time movement',
      label_ml: 'രാത്രിയിലെ അസ്വാഭാവിക ചലനം',
      color: '#F0A9A0',
      bgAccent: 'rgba(240, 169, 160, 0.15)',
      badge: 'Sleep Disruption',
    },
    {
      type: 'long_stillness',
      label_en: 'Long stillness',
      label_ml: 'ദീർഘനേരത്തെ ചലനമില്ലായ്മ',
      color: '#A9C8E3',
      bgAccent: 'rgba(169, 200, 227, 0.15)',
      badge: 'Immobility (180m)',
    },
    {
      type: 'pendant_removed',
      label_en: 'Pendant removed',
      label_ml: 'ലോക്കറ്റ് അഴിച്ചുമാറ്റി',
      color: '#F0A9A0',
      bgAccent: 'rgba(240, 169, 160, 0.15)',
      badge: 'Skin Contact Lost',
    },
    {
      type: 'low_battery',
      label_en: 'Low battery (12%)',
      label_ml: 'ബാറ്ററി കുറവാണ്',
      color: '#A9C8E3',
      bgAccent: 'rgba(169, 200, 227, 0.15)',
      badge: 'Power Warning',
    },
    {
      type: 'data_lost',
      label_en: 'Mobile data lost -> SMS backup',
      label_ml: 'ഡാറ്റ നഷ്ടപ്പെട്ടു (SMS ബാക്കപ്പ്)',
      color: '#A9C8E3',
      bgAccent: 'rgba(169, 200, 227, 0.15)',
      badge: 'Cellular Bridge',
    },
    {
      type: 'normal',
      label_en: 'Return to normal / Reset all',
      label_ml: 'സാധാരണ നിലയിലാക്കുക',
      color: '#9CCDB0',
      bgAccent: 'rgba(156, 205, 176, 0.15)',
      badge: 'Clear Telemetry',
    },
  ];

  return (
    <div className="min-h-screen bg-base-dark text-primary-dark p-4 md:p-6 lg:p-8 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-dark shadow-neu-sm-dark flex items-center justify-center p-2 border border-white/5">
            <Radio className="w-5 h-5 text-accent-peach animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-primary-dark">
                CORESENSE
              </h1>
              <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-surface-dark border border-white/10 text-muted-dark">
                Hardware Simulator (Interface A)
              </span>
            </div>
            <p className="text-xs text-muted-dark font-medium">
              Live Pitch Demo • Dementia Care Pendant Simulation
            </p>
          </div>
        </div>

        {/* Pairing Badge, Room Code, Open Phone URL & Language Switch */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-dark border border-white/5 shadow-neu-sm-dark text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-status-safe shadow-[0_0_8px_#9CCDB0]'
                  : 'bg-accent-peach animate-ping'
              }`}
            />
            <span className="font-semibold text-primary-dark">
              {connectionStatus === 'connected'
                ? 'Caregiver Phone Connected'
                : 'Waiting for phone...'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-[11px] text-accent-peach">
              Room #{roomCode}
            </span>
          </div>

          <a
            href={phoneAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-dark border border-white/5 shadow-neu-sm-dark text-xs font-semibold text-muted-dark hover:text-primary-dark transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open Phone URL</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Bilingual Switcher */}
          <div className="flex items-center rounded-full bg-surface-dark p-1 border border-white/5 shadow-neu-sm-dark">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                lang === 'en'
                  ? 'bg-accent-peach text-base-dark shadow-sm'
                  : 'text-muted-dark hover:text-primary-dark'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ml')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                lang === 'ml'
                  ? 'bg-accent-peach text-base-dark shadow-sm'
                  : 'text-muted-dark hover:text-primary-dark'
              }`}
            >
              മലയാളം
            </button>
          </div>
        </div>
      </header>

      {/* Caregiver Acknowledgment Banner (Triggered when phone caregiver clicks Acknowledge) */}
      {caregiverAckNotification && (
        <div className="mt-4 p-4 rounded-3xl bg-status-safe/15 border border-status-safe/40 shadow-neu-flat-dark flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-status-safe/25 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-status-safe" />
            </div>
            <div>
              <div className="text-sm font-bold text-status-safe flex items-center gap-2">
                <span>Caregiver Responded in Real Time!</span>
                <span className="text-xs text-muted-dark font-normal">
                  ({new Date(caregiverAckNotification.timestamp).toLocaleTimeString()})
                </span>
              </div>
              <p className="text-xs text-primary-dark">
                {caregiverAckNotification.caregiverName} tapped &quot;
                {caregiverAckNotification.actionTaken === 'acknowledged'
                  ? 'Acknowledge'
                  : caregiverAckNotification.actionTaken}
                &quot; on the phone. Telemetry alert marked resolved.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-status-safe/20 text-status-safe font-semibold">
            &lt; 0.4s Supabase Sync
          </span>
        </div>
      )}

      {/* Main Grid: Left Column (Digital Twin & Pairing), Right Column (Tactile Scenario Trigger Pad) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 flex-grow items-start">
        {/* Left Column: Digital Twin & Pairing (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          {/* Digital Twin Card */}
          <div className="p-6 rounded-4xl bg-surface-dark border border-white/5 shadow-neu-flat-dark flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-dark">
                  Pendant Digital Twin
                </span>
              </div>
              <span className="text-[11px] text-accent-peach font-semibold px-2 py-0.5 rounded-full bg-accent-peach/10">
                Active Telemetry
              </span>
            </div>

            <PendantDigitalTwin
              status={state.status}
              battery={state.battery}
              batteryDaysRemaining={state.batteryDaysRemaining}
              isDataConnected={state.isDataConnected}
              className="my-3"
            />

            {/* Wearer profile card */}
            <div className="w-full mt-4 p-3.5 rounded-2xl bg-base-dark/50 border border-white/5 flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-dark block text-[10px] uppercase font-bold">
                  Wearer Profile
                </span>
                <span className="font-bold text-primary-dark text-sm">
                  {lang === 'en' ? state.wearerName.en : state.wearerName.ml} (Age 78)
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-dark block text-[10px] uppercase font-bold">
                  Current Safe Zone
                </span>
                <span className="font-semibold text-status-safe">
                  {lang === 'en' ? state.currentZone.name_en : state.currentZone.name_ml}
                </span>
              </div>
            </div>
          </div>

          {/* Pairing & QR Code Card */}
          <div className="p-6 rounded-4xl bg-surface-dark border border-white/5 shadow-neu-flat-dark flex flex-col sm:flex-row items-center gap-6">
            <div className="p-3 bg-white rounded-2xl shadow-md shrink-0">
              <QRCodeSVG
                value={phoneAppUrl}
                size={112}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="flex-grow space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-dark">
                  Phone Pairing
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-peach/20 text-accent-peach">
                  Instant Scan
                </span>
              </div>
              <h3 className="text-sm font-bold text-primary-dark">
                Scan with phone camera to open Caregiver App
              </h3>
              <p className="text-xs text-muted-dark">
                Opens mobile interface and auto-joins room{' '}
                <span className="font-mono text-accent-peach font-bold">#{roomCode}</span> via
                Supabase Realtime broadcast.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  onClick={copyLink}
                  className="px-3 py-1.5 rounded-full bg-base-dark border border-white/10 text-xs font-semibold text-primary-dark hover:text-accent-peach transition-colors flex items-center gap-1.5 shadow-neu-sm-dark"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-status-safe" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Pairing Link'}</span>
                </button>

                <a
                  href={phoneAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-accent-peach text-base-dark text-xs font-bold hover:bg-accent-peachHover transition-colors flex items-center gap-1 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test in New Tab</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Tactical Neumorphic Scenario Trigger Pad (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 rounded-4xl bg-surface-dark border border-white/5 shadow-neu-flat-dark">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-dark">
                  Pitch Scenario Triggers
                </h2>
                <p className="text-xs text-primary-dark font-medium mt-0.5">
                  Click any scenario button to transmit instantaneous telemetry to the phone
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-base-dark text-muted-dark">
                8 Scenarios
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {scenarioButtons.map((btn) => {
                const isSelected = selectedScenario === btn.type;
                const isNormal = btn.type === 'normal';

                return (
                  <button
                    key={btn.type}
                    onClick={() => handleTriggerScenario(btn.type)}
                    className={`relative p-3.5 rounded-2xl text-left transition-all duration-200 border ${
                      isSelected
                        ? 'shadow-neu-pressed-dark border-accent-peach/50 bg-[#282224]'
                        : 'shadow-neu-flat-dark border-white/5 bg-surface-dark hover:border-white/15 active:shadow-neu-pressed-dark'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: btn.color,
                          boxShadow: `0 0 8px ${btn.color}`,
                        }}
                      />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-base-dark/70 text-muted-dark">
                        {btn.badge}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-primary-dark line-clamp-1">
                      {lang === 'en' ? btn.label_en : btn.label_ml}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-muted-dark">
                        {isNormal ? 'Reset Nominal State' : 'Broadcast to Phone'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted-dark" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Prototype Disclaimer Note */}
      <footer className="mt-auto pt-6 border-t border-white/5 text-center text-xs text-muted-dark">
        <p className="max-w-2xl mx-auto italic">
          &quot;{t.prototypeDisclaimer}&quot;
        </p>
      </footer>
    </div>
  );
};
