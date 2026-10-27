import { LocationCoordinate, SafeZone, PendantState, AlertEvent, ScenarioType } from '../types';

export const KERALA_HOME_BASE: LocationCoordinate = {
  lat: 10.35578,
  lng: 76.21365,
  label: 'Christ College Campus, Irinjalakuda, Kerala',
};

export const SAFE_ZONES: SafeZone[] = [
  {
    id: 'main_block',
    name_en: 'Main Academic Block',
    name_ml: 'പ്രധാന അക്കാദമിക് ബ്ലോക്ക്',
    center: { lat: 10.35578, lng: 76.21365, label: 'Central Academic Block, Christ College' },
    radiusMeters: 35,
    allowedHoursStart: 7, // 7 AM
    allowedHoursEnd: 21,  // 9 PM
    description_en: 'Central college academic zone and seminar halls. Active daytime environment.',
    description_ml: 'പ്രധാന അക്കാദമിക് ബ്ലോക്കും സെമിനാർ ഹാളുകളും. പകൽസമയത്തെ സുരക്ഷിത മേഖല.',
  },
  {
    id: 'library',
    name_en: 'Central Library & Reading Hall',
    name_ml: 'സെൻട്രൽ ലൈബ്രറി',
    center: { lat: 10.35615, lng: 76.21390, label: 'Central Library Building' },
    radiusMeters: 28,
    allowedHoursStart: 8, // 8 AM
    allowedHoursEnd: 20,  // 8 PM
    description_en: 'Quiet indoor study and research wing. Monitored for low disturbance.',
    description_ml: 'ലൈബ്രറിയും ശാന്തമായ വായനാ മുറിയും. രാത്രി 8:00 വരെ സുരക്ഷിതം.',
  },
  {
    id: 'botanical_garden',
    name_en: 'Botanical Garden & Courtyard',
    name_ml: 'ബൊട്ടാണിക്കൽ ഗാർഡനും തോട്ടവും',
    center: { lat: 10.35640, lng: 76.21320, label: 'Botanical Garden & Green Quad' },
    radiusMeters: 45,
    allowedHoursStart: 7,  // 7 AM
    allowedHoursEnd: 18,  // 6 PM
    description_en: 'Open outdoor herbal garden and walking pathway. Safe during daylight hours (7 AM - 6 PM); restricted after sunset to mitigate sundowning risk.',
    description_ml: 'ഹരിത കാമ്പസ് തോട്ടം. പകൽ നടക്കാൻ സുരക്ഷിതം (രാവിലെ 7:00 മുതൽ വൈകിട്ട് 6:00 വരെ). സൂര്യാസ്തമയത്തിന് ശേഷം നിയന്ത്രിതം.',
  },
  {
    id: 'stadium_ground',
    name_en: 'Stadium & Sports Complex',
    name_ml: 'കോളേജ് സ്റ്റേഡിയം ഗ്രൗണ്ട്',
    center: { lat: 10.35510, lng: 76.21445, label: 'Christ College Stadium Ground' },
    radiusMeters: 55,
    allowedHoursStart: 6,  // 6 AM
    allowedHoursEnd: 19,  // 7 PM
    description_en: 'Expansive football ground and athletics pavilion with open perimeter.',
    description_ml: 'ഫുട്ബോൾ സ്റ്റേഡിയവും അത്‌ലറ്റിക് ഗ്രൗണ്ടും.',
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
    name_en: 'Main Academic Block',
    name_ml: 'പ്രധാന അക്കാദമിക് ബ്ലോക്ക്',
    isSafeNow: true,
  },
  activeAlert: null,
  history: [
    {
      id: 'init-1',
      timestamp: Date.now() - 1000 * 60 * 45,
      scenario: 'normal',
      status: 'safe',
      title_en: 'Morning Campus Walk Completed',
      title_ml: 'കാമ്പസ് നടത്തം പൂർത്തിയായി',
      description_en: 'Safe return to botanical garden courtyard after 25 min walk.',
      description_ml: '25 മിനിറ്റ് നടത്തത്തിന് ശേഷം ബൊട്ടാണിക്കൽ ഗാർഡനിലേക്ക് സുരക്ഷിതമായി തിരിച്ചെത്തി.',
      severity: 'safe',
      isSmsBackup: false,
      acknowledged: true,
      acknowledgedAt: Date.now() - 1000 * 60 * 44,
      acknowledgedBy: 'Ananya (Caregiver)',
      location: { ...KERALA_HOME_BASE },
      safeZoneName: 'Main Academic Block',
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
          description_en: 'High-G impact vector followed by zero horizontal posture recovery detected near Main Academic Block.',
          description_ml: 'പെട്ടെന്ന് താഴെ വീണതായും നിലത്ത് അനക്കമില്ലാതെ കിടക്കുന്നതായും സെൻസർ കണ്ടെത്തി.',
          severity: 'critical',
          isSmsBackup: false,
          acknowledged: false,
          location,
          safeZoneName: 'Main Academic Block',
          battery,
        },
      };

    case 'wandering': {
      // Offset location outwards towards Irinjalakuda Main Road outside college gate
      const outsideLoc: LocationCoordinate = {
        lat: 10.35715,
        lng: 76.21220,
        label: 'Outer College Road Junction, Irinjalakuda',
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
          description_en: 'Wearer breached Christ College campus gate perimeter towards Irinjalakuda town road unaccompanied.',
          description_ml: 'കല്യാണി അമ്മ ക്രൈസ്റ്റ് കോളേജ് ഗേറ്റ് കടന്ന് ഇരിഞ്ഞാലക്കുട റോഡിലേക്ക് പോയിരിക്കുന്നു. ഉടൻ ശ്രദ്ധിക്കുക.',
          severity: 'critical',
          isSmsBackup: false,
          acknowledged: false,
          location: outsideLoc,
          safeZoneName: 'Outside Campus Boundary',
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
          description_en: 'Motion detected outside quarters near Botanical Garden during deep rest schedule (2:15 AM). Possible dusk/dawn restlessness.',
          description_ml: 'ഉറങ്ങേണ്ട സമയത്ത് (രാത്രി 2:15) ബൊട്ടാണിക്കൽ ഗാർഡന് സമീപം അസ്വാഭാവിക ചലനം ശ്രദ്ധയിൽപ്പെട്ടു.',
          severity: 'warning',
          isSmsBackup: false,
          acknowledged: false,
          location,
          safeZoneName: 'Botanical Garden & Courtyard',
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
          description_en: 'Zero micro-movement recorded for 180 continuous minutes in the Central Library reading wing.',
          description_ml: 'കഴിഞ്ഞ 180 മിനിറ്റായി യാതൊരുവിധ ചലനങ്ങളും രേഖപ്പെടുത്തിയിട്ടില്ല. സുഖവിവരം പരിശോധിക്കുക.',
          severity: 'warning',
          isSmsBackup: false,
          acknowledged: false,
          location,
          safeZoneName: 'Central Library',
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
          safeZoneName: 'Main Academic Block',
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
          safeZoneName: 'Main Academic Block',
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
          safeZoneName: 'Main Academic Block',
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
