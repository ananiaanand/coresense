import { LocationCoordinate, SafeZone, PendantState, AlertEvent, ScenarioType } from '../types';

export const KERALA_HOME_BASE: LocationCoordinate = {
  lat: 9.99814,
  lng: 76.35331,
  label: 'Kakkanad Residence, Kochi, Kerala',
};

export const SAFE_ZONES: SafeZone[] = [
  {
    id: 'living_room',
    name_en: 'Living Room & Dining',
    name_ml: 'സ്വീകരണമുറിയും ഡൈനിങ് ഹാളും',
    center: { lat: 9.99814, lng: 76.35331, label: 'Indoor Living Area' },
    radiusMeters: 20,
    allowedHoursStart: 7, // 7 AM
    allowedHoursEnd: 22,  // 10 PM
    description_en: 'Active daytime zone. Fully safe between 7:00 AM and 10:00 PM.',
    description_ml: 'പകൽസമയത്തെ സുരക്ഷിത മേഖല (രാവിലെ 7:00 മുതൽ രാത്രി 10:00 വരെ).',
  },
  {
    id: 'bedroom',
    name_en: 'Master Bedroom',
    name_ml: 'പ്രധാന കിടപ്പുമുറി',
    center: { lat: 9.99808, lng: 76.35322, label: 'Night Rest Area' },
    radiusMeters: 14,
    allowedHoursStart: 21, // 9 PM
    allowedHoursEnd: 8,   // 8 AM next morning
    description_en: 'Night resting quarters. Motion here is expected at night.',
    description_ml: 'രാത്രി സമയത്തെ വിശ്രമ മുറി (രാത്രി 9:00 മുതൽ രാവിലെ 8:00 വരെ).',
  },
  {
    id: 'garden',
    name_en: 'Front Courtyard & Garden',
    name_ml: 'മുൻവശത്തെ തോട്ടവും പൂമുഖവും',
    center: { lat: 9.99835, lng: 76.35348, label: 'Green Courtyard' },
    radiusMeters: 32,
    allowedHoursStart: 8,  // 8 AM
    allowedHoursEnd: 18,  // 6 PM
    description_en: 'Open outdoor garden. Safe during daylight hours (8 AM - 6 PM); restricted after sunset to mitigate sundowning risk.',
    description_ml: 'പകൽ 8:00 മുതൽ വൈകിട്ട് 6:00 വരെ സുരക്ഷിതം. സൂര്യാസ്തമയത്തിന് ശേഷം നിയന്ത്രിതം.',
  },
];

export const INITIAL_STATE: PendantState = {
  roomCode: '8492',
  status: 'safe',
  battery: 88,
  batteryDaysRemaining: 5.7,
  timeOfDay: 14.5, // 2:30 PM
  isDataConnected: true,
  location: { ...KERALA_HOME_BASE },
  wearerName: {
    en: 'Kalyani Amma',
    ml: 'കല്യാണി അമ്മ',
  },
  lastSeenTimestamp: Date.now(),
  currentZone: {
    name_en: 'Living Room & Dining',
    name_ml: 'സ്വീകരണമുറിയും ഡൈനിങ് ഹാളും',
    isSafeNow: true,
  },
  activeAlert: null,
  history: [
    {
      id: 'init-1',
      timestamp: Date.now() - 1000 * 60 * 45,
      scenario: 'normal',
      status: 'safe',
      title_en: 'Morning Walk Completed',
      title_ml: 'പ്രഭാത നടത്തം പൂർത്തിയായി',
      description_en: 'Safe return to verandah courtyard after 25 min walk.',
      description_ml: '25 മിനിറ്റ് നടത്തത്തിന് ശേഷം പൂമുഖത്തേക്ക് സുരക്ഷിതമായി തിരിച്ചെത്തി.',
      severity: 'safe',
      isSmsBackup: false,
      acknowledged: true,
      acknowledgedAt: Date.now() - 1000 * 60 * 44,
      acknowledgedBy: 'Ananya (Caregiver)',
      location: { ...KERALA_HOME_BASE },
      safeZoneName: 'Living Room & Dining',
      battery: 92,
    },
  ],
  lastCaregiverAck: null,
};

// Helper to determine if a zone is safe at given hour (0-24)
export function isZoneSafeAtHour(zone: SafeZone, hour: number): boolean {
  if (zone.allowedHoursStart <= zone.allowedHoursEnd) {
    return hour >= zone.allowedHoursStart && hour <= zone.allowedHoursEnd;
  } else {
    // Overnight zone (e.g. 21:00 to 08:00)
    return hour >= zone.allowedHoursStart || hour <= zone.allowedHoursEnd;
  }
}

// Convert 0-24 hour number to friendly 12-hour AM/PM string
export function formatTimeOfDay(hourDecimal: number): string {
  const hours = Math.floor(hourDecimal);
  const minutes = Math.floor((hourDecimal - hours) * 60);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${displayHours}:${displayMinutes} ${period}`;
}

// Compute scenario-based alerts
export function createScenarioAlert(
  scenario: ScenarioType,
  battery: number,
  timeOfDay: number,
  location: LocationCoordinate
): {
  alert: AlertEvent | null;
  status: 'safe' | 'warning' | 'alert' | 'offline';
  isDataConnected: boolean;
  newLocation?: LocationCoordinate;
} {
  const timestamp = Date.now();
  const id = `alert-${timestamp}-${Math.random().toString(36).substring(2, 6)}`;

  switch (scenario) {
    case 'fall_detected':
      return {
        status: 'alert',
        isDataConnected: true,
        alert: {
          id,
          timestamp,
          scenario,
          status: 'alert',
          title_en: 'Fall Detected!',
          title_ml: 'വീഴ്ച തിരിച്ചറിഞ്ഞു!',
          description_en: 'High-G impact vector followed by zero horizontal posture recovery detected by edge IMU sensor.',
          description_ml: 'പെട്ടെന്ന് താഴെ വീണതായും നിലത്ത് അനക്കമില്ലാതെ കിടക്കുന്നതായും സെൻസർ കണ്ടെത്തി.',
          severity: 'critical',
          isSmsBackup: false,
          acknowledged: false,
          location,
          safeZoneName: 'Living Room',
          battery,
        },
      };

    case 'wandering': {
      // Offset location outwards towards the road
      const outsideLoc: LocationCoordinate = {
        lat: 9.99945,
        lng: 76.35485,
        label: 'Outer Bypass Junction Road, Kakkanad',
      };
      return {
        status: 'alert',
        isDataConnected: true,
        newLocation: outsideLoc,
        alert: {
          id,
          timestamp,
          scenario,
          status: 'alert',
          title_en: 'Left Safe Zone (Wandering)',
          title_ml: 'സുരക്ഷിത മേഖല വിട്ടു (അലഞ്ഞുതിരിയൽ)',
          description_en: 'Wearer breached the outer residence perimeter boundary towards Kakkanad main road unaccompanied.',
          description_ml: 'കല്യാണി അമ്മ വീടിന്റെ അതിർത്തി കടന്ന് റോഡിലേക്ക് പോയിരിക്കുന്നു. ഉടൻ ശ്രദ്ധിക്കുക.',
          severity: 'critical',
          isSmsBackup: false,
          acknowledged: false,
          location: outsideLoc,
          safeZoneName: 'Outside Safe Zone',
          battery,
        },
      };
    }

    case 'night_movement':
      return {
        status: 'warning',
        isDataConnected: true,
        alert: {
          id,
          timestamp,
          scenario,
          status: 'warning',
          title_en: 'Unusual Night-Time Movement',
          title_ml: 'രാത്രിയിലെ അസ്വാഭാവിക ചലനം',
          description_en: 'Motion detected outside bedroom during deep sleep schedule (2:15 AM). Possible dusk/dawn restlessness.',
          description_ml: 'ഉറങ്ങേണ്ട സമയത്ത് (രാത്രി 2:15) കിടപ്പുമുറിക്ക് പുറത്ത് അസ്വാഭാവിക ചലനം ശ്രദ്ധയിൽപ്പെട്ടു.',
          severity: 'warning',
          isSmsBackup: false,
          acknowledged: false,
          location,
          safeZoneName: 'Front Courtyard',
          battery,
        },
      };

    case 'long_stillness':
      return {
        status: 'warning',
        isDataConnected: true,
        alert: {
          id,
          timestamp,
          scenario,
          status: 'warning',
          title_en: 'Prolonged Stillness Detected',
          title_ml: 'ദീർഘനേരത്തെ ചലനമില്ലായ്മ',
          description_en: 'Zero micro-movement recorded for 180 continuous minutes outside expected sleep window.',
          description_ml: 'കഴിഞ്ഞ 180 മിനിറ്റായി യാതൊരുവിധ ചലനങ്ങളും രേഖപ്പെടുത്തിയിട്ടില്ല. സുഖവിവരം പരിശോധിക്കുക.',
          severity: 'warning',
          isSmsBackup: false,
          acknowledged: false,
          location,
          safeZoneName: 'Armchair in Living Hall',
          battery,
        },
      };

    case 'pendant_removed':
      return {
        status: 'warning',
        isDataConnected: true,
        alert: {
          id,
          timestamp,
          scenario,
          status: 'warning',
          title_en: 'Pendant Removed',
          title_ml: 'ലോക്കറ്റ് അഴിച്ചുമാറ്റി',
          description_en: 'Capacitive skin-touch telemetry disconnected. Necklace has been removed or unlatched.',
          description_ml: 'ലോക്കറ്റ് ശരീരത്തിൽ നിന്ന് അഴിച്ചുമാറ്റിയിരിക്കുന്നു. സ്കിൻ-സെൻസർ ഓഫായി.',
          severity: 'warning',
          isSmsBackup: false,
          acknowledged: false,
          location,
          safeZoneName: 'Living Room',
          battery,
        },
      };

    case 'low_battery':
      return {
        status: 'warning',
        isDataConnected: true,
        alert: {
          id,
          timestamp,
          scenario,
          status: 'warning',
          title_en: 'Low Battery (12% Remaining)',
          title_ml: 'ബാറ്ററി കുറവാണ് (12%)',
          description_en: 'Operating within final 18 hours of 5-7 day charge cycle. Please recharge on magnetic dock.',
          description_ml: 'ബാറ്ററി 12% ആയി കുറഞ്ഞു. ഇന്ന് രാത്രി മാഗ്നറ്റിക് ഡോക്കിൽ വെച്ച് ചാർജ് ചെയ്യുക.',
          severity: 'warning',
          isSmsBackup: false,
          acknowledged: false,
          location,
          safeZoneName: 'Living Room',
          battery: 12,
        },
      };

    case 'data_lost':
      return {
        status: 'warning',
        isDataConnected: false,
        alert: {
          id,
          timestamp,
          scenario,
          status: 'warning',
          title_en: 'Mobile Data Lost — SMS Backup Active',
          title_ml: 'മൊബൈൽ ഡാറ്റ നഷ്ടപ്പെട്ടു - SMS ബാക്കപ്പ് സജീവം',
          description_en: 'Cellular 4G connectivity dropped. CoreSense is broadcasting via encrypted cellular SMS packets.',
          description_ml: 'ഇന്റർനെറ്റ് ലഭ്യമല്ല. എയർടെൽ/ബിഎസ്എൻഎൽ SMS വഴി അടിയന്തര വിവരങ്ങൾ ലഭിക്കുന്നു.',
          severity: 'info',
          isSmsBackup: true,
          acknowledged: false,
          location,
          safeZoneName: 'Living Room',
          battery,
        },
      };

    case 'normal':
    default:
      return {
        status: 'safe',
        isDataConnected: true,
        newLocation: { ...KERALA_HOME_BASE },
        alert: null,
      };
  }
}
