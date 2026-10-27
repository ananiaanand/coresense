export type Language = 'en' | 'ml';

export interface Translations {
  appName: string;
  tagline: string;
  prototypeDisclaimer: string;
  dpdpNotice: string;
  dpdpDetails: string;
  statusSafe: string;
  statusWarning: string;
  statusAlert: string;
  statusOffline: string;
  wearerName: string;
  batteryRemaining: string;
  lastSeenJustNow: string;
  lastSeenAgo: string;
  currentZone: string;
  inSafeZone: string;
  outsideSafeZone: string;
  actions: {
    call: string;
    navigate: string;
    acknowledge: string;
    acknowledgedSuccess: string;
    reset: string;
    connect: string;
    waitingPhone: string;
    connected: string;
    simulate: string;
  };
  tabs: {
    home: string;
    alerts: string;
    zones: string;
    settings: string;
  };
  scenarios: {
    fall_detected: {
      title: string;
      desc: string;
      tag: string;
    };
    wandering: {
      title: string;
      desc: string;
      tag: string;
    };
    night_movement: {
      title: string;
      desc: string;
      tag: string;
    };
    long_stillness: {
      title: string;
      desc: string;
      tag: string;
    };
    pendant_removed: {
      title: string;
      desc: string;
      tag: string;
    };
    low_battery: {
      title: string;
      desc: string;
      tag: string;
    };
    data_lost: {
      title: string;
      desc: string;
      tag: string;
    };
    normal: {
      title: string;
      desc: string;
      tag: string;
    };
  };
  smsAlert: {
    badge: string;
    sender: string;
    body: string;
  };
  zones: {
    garden: { name: string; hours: string; note: string };
    livingRoom: { name: string; hours: string; note: string };
    bedroom: { name: string; hours: string; note: string };
    compound: { name: string; hours: string; note: string };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Coresense',
    tagline: 'A Little Pendant. A Little More Peace of Mind.',
    prototypeDisclaimer:
      'Coresense is in the prototype stage. Features and battery life are design targets and will be confirmed in field pilots.',
    dpdpNotice: 'Privacy & DPDP Act 2023',
    dpdpDetails:
      'Zero camera, zero microphone. All sensor ML runs on-device. Fully compliant under India’s Digital Personal Data Protection Act 2023.',
    statusSafe: 'Safe & Rested',
    statusWarning: 'Attention Needed',
    statusAlert: 'Emergency Alert',
    statusOffline: 'Device Offline',
    wearerName: 'Kalyani Amma',
    batteryRemaining: 'days remaining',
    lastSeenJustNow: 'Active right now',
    lastSeenAgo: 'ago',
    currentZone: 'Current Zone',
    inSafeZone: 'Inside Safe Zone',
    outsideSafeZone: 'Outside Safe Boundary',
    actions: {
      call: 'Call Wearer',
      navigate: 'Navigate',
      acknowledge: 'Acknowledge Alert',
      acknowledgedSuccess: 'Caregiver Responded & On the Way',
      reset: 'Return to Normal',
      connect: 'Pairing Room',
      waitingPhone: 'Waiting for phone...',
      connected: 'Live Connected',
      simulate: 'Trigger Scenario',
    },
    tabs: {
      home: 'Home',
      alerts: 'Alerts',
      zones: 'Safe Zones',
      settings: 'Settings',
    },
    scenarios: {
      fall_detected: {
        title: 'Fall Detected!',
        desc: 'Sudden impact and prolonged floor orientation detected by CoreSense pendant.',
        tag: 'Critical Impact',
      },
      wandering: {
        title: 'Left Safe Zone (Wandering)',
        desc: 'Wearer has moved beyond the home perimeter without a registered family companion.',
        tag: 'Boundary Breached',
      },
      night_movement: {
        title: 'Unusual Night-Time Movement',
        desc: 'Active movement detected outside bedroom during scheduled sleep hours (2:15 AM).',
        tag: 'Sleep Disruption',
      },
      long_stillness: {
        title: 'Long Stillness Detected',
        desc: 'No micro-movements detected for 180 minutes outside normal rest patterns.',
        tag: 'Immobility Check',
      },
      pendant_removed: {
        title: 'Pendant Removed',
        desc: 'Skin-contact capacitive sensor indicates necklace has been unclasped or taken off.',
        tag: 'Sensor Detached',
      },
      low_battery: {
        title: 'Low Battery (12%)',
        desc: 'Target 5-7 day cycle reaching completion. Please place pendant on magnetic dock tonight.',
        tag: 'Power Alert',
      },
      data_lost: {
        title: 'Mobile Data Lost — SMS Backup',
        desc: 'Cellular 4G link dropped. CoreSense has automatically switched to cellular SMS emergency bridge.',
        tag: 'SMS Fallback',
      },
      normal: {
        title: 'All Normal & Safe',
        desc: 'Sensor telemetry is steady. Kalyani Amma is in the living room safe zone.',
        tag: 'Safe State',
      },
    },
    smsAlert: {
      badge: 'EMERGENCY SMS FALLBACK (AIRTEL/BSNL)',
      sender: 'CORESENSE-ALERT-IN',
      body: 'CORESENSE ALERT: Kalyani Amma at Christ College, Irinjalakuda. Mobile data connection dropped. SMS emergency link active. Location: 10.3558° N, 76.2137° E (Main Block). Battery: 84%.',
    },
    zones: {
      garden: {
        name: 'Front Garden & Verandah',
        hours: 'Safe: 08:00 AM – 06:00 PM',
        note: 'Restricted after sunset to prevent dusk disorientation (sundowning).',
      },
      livingRoom: {
        name: 'Main Living Hall & Dining',
        hours: 'Safe: 07:00 AM – 10:00 PM',
        note: 'Daytime family interaction zone.',
      },
      bedroom: {
        name: 'Master Bedroom & En-suite',
        hours: 'Safe: 09:00 PM – 08:00 AM',
        note: 'Rest zone with night-time motion threshold monitoring.',
      },
      compound: {
        name: 'Outside Main Gate / Road',
        hours: 'Always Restricted',
        note: 'Triggers instant wandering alert if crossed unaccompanied.',
      },
    },
  },
  ml: {
    appName: 'കോർസെൻസ്',
    tagline: 'ഒരു കൊച്ചു ലോക്കറ്റ്. കുടുംബത്തിന് വലിയ മനഃസമാധാനം.',
    prototypeDisclaimer:
      'കോർസെൻസ് നിലവിൽ പ്രോട്ടോടൈപ്പ് ഘട്ടത്തിലാണ്. സവിശേഷതകളും ബാറ്ററി ആയുസ്സും ഫീൽഡ് പരീക്ഷണങ്ങളിലൂടെ സ്ഥിരീകരിക്കും.',
    dpdpNotice: 'സ്വകാര്യതയും ഡി.പി.ഡി.പി ആക്റ്റ് 2023',
    dpdpDetails:
      'ക്യാമറയോ മൈക്രോഫോണോ ഇല്ല. എല്ലാ സെൻസർ വിവരങ്ങളും ഉപകരണത്തിൽ തന്നെ പ്രോസസ്സ് ചെയ്യുന്നു. ഇന്ത്യയുടെ 2023 ലെ ഡിജിറ്റൽ വ്യക്തിഗത ഡാറ്റ സംരക്ഷണ നിയമത്തിന് പൂർണ്ണമായും വിധേയം.',
    statusSafe: 'സുരക്ഷിതയാണ്',
    statusWarning: 'ശ്രദ്ധിക്കുക',
    statusAlert: 'അടിയന്തര മുന്നറിയിപ്പ്',
    statusOffline: 'ഓഫ്‌ലൈൻ',
    wearerName: 'കല്യാണി അമ്മ',
    batteryRemaining: 'ദിവസങ്ങൾ ബാക്കി',
    lastSeenJustNow: 'ഇപ്പോൾ സജീവം',
    lastSeenAgo: 'മുമ്പ്',
    currentZone: 'നിലവിലെ മേഖല',
    inSafeZone: 'സുരക്ഷിത മേഖലയിൽ',
    outsideSafeZone: 'സുരക്ഷിത മേഖലയ്ക്ക് പുറത്ത്',
    actions: {
      call: 'വിളിക്കുക',
      navigate: 'വഴി കാണിക്കുക',
      acknowledge: 'അറിയിപ്പ് സ്വീകരിച്ചു',
      acknowledgedSuccess: 'പരിചാരകൻ പ്രതികരിച്ചു, ഉടൻ എത്തും',
      reset: 'സാധാരണ നിലയിലാക്കുക',
      connect: 'റൂം കണക്ഷൻ',
      waitingPhone: 'ഫോണിനായി കാത്തിരിക്കുന്നു...',
      connected: 'കണക്റ്റ് ചെയ്തു',
      simulate: 'സിമുലേഷൻ പ്രവർത്തിപ്പിക്കുക',
    },
    tabs: {
      home: 'ഹോം',
      alerts: 'അറിയിപ്പുകൾ',
      zones: 'മേഖലകൾ',
      settings: 'വിവരങ്ങൾ',
    },
    scenarios: {
      fall_detected: {
        title: 'വീഴ്ച തിരിച്ചറിഞ്ഞു!',
        desc: 'പെട്ടെന്ന് താഴെ വീണതായും നിലത്ത് അനക്കമില്ലാതെ കിടക്കുന്നതായും കോർസെൻസ് ലോക്കറ്റ് കണ്ടെത്തി.',
        tag: 'അടിയന്തര വീഴ്ച',
      },
      wandering: {
        title: 'സുരക്ഷിത മേഖല വിട്ടു (അലഞ്ഞുതിരിയൽ)',
        desc: 'കല്യാണി അമ്മ വീടിന്റെ അതിർത്തി കടന്ന് പുറത്തേക്ക് പോയിരിക്കുന്നു. സഹായി ആരും കൂടെയില്ല.',
        tag: 'അതിർത്തി ലംഘിച്ചു',
      },
      night_movement: {
        title: 'രാത്രിയിലെ അസ്വാഭാവിക ചലനം',
        desc: 'ഉറങ്ങേണ്ട സമയത്ത് (രാത്രി 2:15) കിടപ്പുമുറിക്ക് പുറത്ത് അസ്വാഭാവിക ചലനം ശ്രദ്ധയിൽപ്പെട്ടു.',
        tag: 'ഉറക്കത്തിലെ ചലനം',
      },
      long_stillness: {
        title: 'ദീർഘനേരത്തെ ചലനമില്ലായ്മ',
        desc: 'കഴിഞ്ഞ 180 മിനിറ്റായി യാതൊരുവിധ ചലനങ്ങളും രേഖപ്പെടുത്തിയിട്ടില്ല. സുഖവിവരം അന്വേഷിക്കുക.',
        tag: 'ചലനമില്ലായ്മ',
      },
      pendant_removed: {
        title: 'ലോക്കറ്റ് അഴിച്ചുമാറ്റി',
        desc: 'ലോക്കറ്റ് ശരീരത്തിൽ നിന്ന് വേർപെടുത്തിയിരിക്കുന്നു. സ്കിൻ-സെൻസർ ഓഫായി.',
        tag: 'ലോക്കറ്റ് മാറ്റി',
      },
      low_battery: {
        title: 'ബാറ്ററി കുറവാണ് (12%)',
        desc: '5-7 ദിവസത്തെ ബാറ്ററി സൈക്കിൾ പൂർത്തിയാകുന്നു. ഇന്ന് രാത്രി മാഗ്നറ്റിക് ഡോക്കിൽ വെച്ച് ചാർജ് ചെയ്യുക.',
        tag: 'ബാറ്ററി അലേർട്ട്',
      },
      data_lost: {
        title: 'മൊബൈൽ ഡാറ്റ വിച്ഛേദിക്കപ്പെട്ടു - SMS ബാക്കപ്പ്',
        desc: 'മൊബൈൽ ഇന്റർനെറ്റ് നഷ്ടപ്പെട്ടു. കോർസെൻസ് സെല്ലുലാർ SMS വഴി അടിയന്തര സന്ദേശങ്ങൾ അയക്കുന്നു.',
        tag: 'എസ്.എം.എസ് ബാക്കപ്പ്',
      },
      normal: {
        title: 'എല്ലാം സാധാരണ നിലയിലായി',
        desc: 'സെൻസറുകൾ സാധാരണ നിലയിലാണ്. കല്യാണി അമ്മ സ്വീകരണമുറിയിൽ സുരക്ഷിതയാണ്.',
        tag: 'സുരക്ഷിതം',
      },
    },
    smsAlert: {
      badge: 'അടിയന്തര എസ്.എം.എസ് ബാക്കപ്പ് (ബി.എസ്.എൻ.എൽ / എയർടെൽ)',
      sender: 'CORESENSE-ALERT-IN',
      body: 'കോർസെൻസ് മുന്നറിയിപ്പ്: കല്യാണി അമ്മ ക്രൈസ്റ്റ് കോളേജ് ഇരിഞ്ഞാലക്കുട കാമ്പസിലാണ്. മൊബൈൽ ഇന്റർനെറ്റ് നഷ്ടപ്പെട്ടതിനാൽ SMS ബാക്കപ്പ് പ്രവർത്തിക്കുന്നു. സ്ഥാനം: 10.3558° N, 76.2137° E (പ്രധാന ബ്ലോക്ക്). ബാറ്ററി: 84%.',
    },
    zones: {
      garden: {
        name: 'മുൻവശത്തെ തോട്ടവും പൂമുഖവും',
        hours: 'സുരക്ഷിതം: രാവിലെ 08:00 – വൈകിട്ട് 06:00',
        note: 'സൂര്യാസ്തമയത്തിന് ശേഷം തോട്ടത്തിലേക്ക് ഇറങ്ങുന്നത് സുരക്ഷിതമല്ല.',
      },
      livingRoom: {
        name: 'സ്വീകരണമുറിയും ഡൈനിങ് ഹാളും',
        hours: 'സുരക്ഷിതം: രാവിലെ 07:00 – രാത്രി 10:00',
        note: 'പകൽസമയത്തെ കുടുംബ മേഖല.',
      },
      bedroom: {
        name: 'പ്രധാന കിടപ്പുമുറി',
        hours: 'സുരക്ഷിതം: രാത്രി 09:00 – രാവിലെ 08:00',
        note: 'രാത്രി സമയത്തെ വിശ്രമ മേഖല.',
      },
      compound: {
        name: 'ഗേറ്റിന് വെളിയിൽ / റോഡ്',
        hours: 'എപ്പോഴും നിയന്ത്രിതം',
        note: 'അനുവാദമില്ലാതെ റോഡിലേക്ക് പോയാൽ ഉടനടി അപായസന്ദേശം അയക്കും.',
      },
    },
  },
};
