export type DeviceStatus = 'safe' | 'warning' | 'alert' | 'offline';

export type ScenarioType =
  | 'fall_detected'
  | 'wandering'
  | 'night_movement'
  | 'long_stillness'
  | 'pendant_removed'
  | 'low_battery'
  | 'data_lost'
  | 'normal';

export interface LocationCoordinate {
  lat: number;
  lng: number;
  label: string;
}

export interface SafeZone {
  id: string;
  name_en: string;
  name_ml: string;
  center: LocationCoordinate;
  radiusMeters: number;
  allowedHoursStart: number; // e.g., 8 (8 AM)
  allowedHoursEnd: number;   // e.g., 18 (6 PM)
  description_en: string;
  description_ml: string;
}

export interface AlertEvent {
  id: string;
  timestamp: number;
  scenario: ScenarioType;
  status: DeviceStatus;
  title_en: string;
  title_ml: string;
  description_en: string;
  description_ml: string;
  severity: 'critical' | 'warning' | 'info' | 'safe';
  isSmsBackup: boolean;
  acknowledged: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  location: LocationCoordinate;
  safeZoneName: string;
  battery: number;
}

export interface CaregiverAckPayload {
  alertId: string;
  timestamp: number;
  caregiverName: string;
  actionTaken: 'acknowledged' | 'called' | 'navigating';
}

export interface PendantState {
  roomCode: string;
  status: DeviceStatus;
  battery: number; // 0 - 100%
  batteryDaysRemaining: number; // calculated 5-7 days range
  timeOfDay: number; // 0.0 - 24.0 (e.g. 14.5 is 2:30 PM)
  isDataConnected: boolean; // if false, fallback SMS active
  location: LocationCoordinate;
  wearerName: {
    en: string;
    ml: string;
  };
  lastSeenTimestamp: number;
  currentZone: {
    name_en: string;
    name_ml: string;
    isSafeNow: boolean;
  };
  activeAlert: AlertEvent | null;
  history: AlertEvent[];
  lastCaregiverAck?: CaregiverAckPayload | null;
}

export type SyncMessage =
  | { type: 'STATE_SYNC'; payload: PendantState }
  | { type: 'ALERT_TRIGGERED'; payload: AlertEvent }
  | { type: 'CAREGIVER_ACK'; payload: CaregiverAckPayload }
  | { type: 'PHONE_JOINED'; payload: { roomCode: string; joinedAt: number } }
  | { type: 'REQUEST_STATE'; payload: { roomCode: string } }
  | { type: 'HEARTBEAT'; payload: { sender: 'simulator' | 'phone'; timestamp: number } };
