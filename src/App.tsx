import { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Users, AlertTriangle, Settings, Bell, HeartPulse, Thermometer, Droplets, Brain, Zap, Watch, Smartphone, MapPin, PhoneCall, CheckCircle2, MessageSquare, Moon, Sun, Bluetooth, BluetoothSearching, Menu, X, LogOut, User, ChevronLeft } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

type PatientState = 'normal' | 'warning' | 'ictal' | 'post-ictal';
type EmergencyState = 'idle' | 'locating' | 'calling' | 'notified';

interface SeizureEvent {
  id: string;
  timestamp: string;
  duration: number;
  type: 'Auto' | 'Manual';
  notes?: string;
}

function Sparkline({ data, color, className = "h-8 w-16 sm:w-20 opacity-70" }: { data: number[], color: string, className?: string }) {
  const chartData = data.map((val, i) => ({ value: val, index: i }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = (max - min) * 0.1 || 1;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('epiguard-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'menu' | 'settings' | 'profile'>('menu');

  // User Profile State
  const [userProfile, setUserProfile] = useState<{name: string, email: string, image: string} | null>(() => {
    const saved = localStorage.getItem('epiguard-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleGoogleLogin = () => {
    // Mock Google Login
    const mockUser = {
      name: "Nahom Solomon",
      email: "nahomsolomon445@gmail.com",
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=Nahom`
    };
    setUserProfile(mockUser);
    localStorage.setItem('epiguard-user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('epiguard-user');
    setSidebarView('menu');
  };

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('epiguard-onboarding-complete') !== 'true';
  });

  const [permissions, setPermissions] = useState({
    bluetooth: false,
    location: false,
    notifications: false
  });

  // Apply theme class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('epiguard-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('epiguard-theme', 'light');
    }
  }, [isDarkMode]);

  // Connection State
  const [connectionMode, setConnectionMode] = useState<'simulated' | 'watch'>('simulated');
  const [watchName, setWatchName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Patient Physiological State
  const [patientState, setPatientState] = useState<PatientState>('normal');
  const [seizureCount, setSeizureCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const tickRef = useRef(0);

  // New Features State
  const [alertCountdown, setAlertCountdown] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [seizureHistory, setSeizureHistory] = useState<SeizureEvent[]>(() => {
    const saved = localStorage.getItem('epiguard-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('epiguard-settings');
    return saved ? JSON.parse(saved) : {
      hrThreshold: 120,
      movementThreshold: 80,
      eegThreshold: 80,
      countdownSeconds: 15
    };
  });
  const [currentSeizureStartTime, setCurrentSeizureStartTime] = useState<number | null>(null);
  const [currentSeizureType, setCurrentSeizureType] = useState<'Auto' | 'Manual' | null>(null);

  // Emergency Protocol State
  const [emergencyState, setEmergencyState] = useState<EmergencyState>('idle');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Vitals State
  const [vitals, setVitals] = useState({
    heartRate: 72,
    o2Sat: 98,
    systolic: 120,
    diastolic: 80,
    temperature: 36.5,
    activeCases: 1248,
    pendingAlerts: 24,
    history: {
      heartRate: Array(20).fill(72),
      o2Sat: Array(20).fill(98),
      systolic: Array(20).fill(120),
      diastolic: Array(20).fill(80),
      temperature: Array(20).fill(36.5)
    }
  });

  // Neurological State
  const [neurological, setNeurological] = useState({
    eegIndex: 45,
    movement: 12,
    seizureRisk: 'Low',
    history: {
      eegIndex: Array(20).fill(45),
      movement: Array(20).fill(12)
    }
  });

  // Smartwatch Connection (Web Bluetooth API)
  const connectWatch = async () => {
    try {
      if (!navigator.bluetooth) {
        alert("Web Bluetooth is not supported in this browser. Please use Chrome or Edge on Android/Desktop.");
        return;
      }
      setIsScanning(true);
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate']
      });
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('heart_rate');
      const characteristic = await service?.getCharacteristic('heart_rate_measurement');
      
      characteristic?.startNotifications();
      characteristic?.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const hr = value.getUint8(1);
        setVitals(prev => ({ ...prev, heartRate: hr }));
      });

      setWatchName(device.name || 'Smartwatch');
      setConnectionMode('watch');
      setPermissions(prev => ({ ...prev, bluetooth: true }));
      setIsScanning(false);
    } catch (error) {
      console.error("Bluetooth connection failed:", error);
      setIsScanning(false);
      alert("Could not connect to smartwatch. Ensure Bluetooth is enabled and a compatible device is nearby. Falling back to realistic simulation.");
    }
  };

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(prev => ({ ...prev, location: true })),
        (err) => {
          console.error("Location permission denied:", err);
          alert("Location access is required for emergency GPS tracking.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPermissions(prev => ({ ...prev, notifications: true }));
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('epiguard-onboarding-complete', 'true');
    setShowOnboarding(false);
  };

  // Auto-Detect Seizure from Sensor Data
  useEffect(() => {
    if (patientState === 'normal') {
      // Detection heuristic: high heart rate, low O2, high movement, high EEG
      const isHighHR = vitals.heartRate > appSettings.hrThreshold;
      const isLowO2 = vitals.o2Sat < 90;
      const isHighMovement = neurological.movement > appSettings.movementThreshold;
      const isHighEeg = neurological.eegIndex > appSettings.eegThreshold;

      // If multiple indicators are present, trigger a seizure
      if ((isHighHR && isHighMovement) || (isHighEeg && isHighMovement) || (isHighHR && isLowO2)) {
        triggerSeizure('Auto');
      }
    }
  }, [vitals.heartRate, vitals.o2Sat, neurological.movement, neurological.eegIndex, patientState, appSettings]);

  // Automated Emergency Protocol
  useEffect(() => {
    if (patientState === 'ictal' && emergencyState === 'idle') {
      setEmergencyState('locating');
      
      // 1. Get GPS Location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setEmergencyState('calling');
          },
          (err) => {
            console.error("Location error:", err);
            // Fallback location if denied
            setLocation({ lat: 37.7749, lng: -122.4194 });
            setEmergencyState('calling');
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        setLocation({ lat: 37.7749, lng: -122.4194 });
        setEmergencyState('calling');
      }
    }
  }, [patientState, emergencyState]);

  // Simulate the automated backend phone call delay
  useEffect(() => {
    if (emergencyState === 'calling') {
      const timer = setTimeout(() => {
        setEmergencyState('notified');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [emergencyState]);

  // Realistic Physiological Simulation Engine
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;

      setVitals(prev => {
        let targetHR = 72;
        let targetO2 = 98;
        let targetSys = 120;
        let targetDia = 80;
        let targetTemp = 36.5;

        // Physiological state overrides
        if (patientState === 'ictal') {
          targetHR = 145 + Math.sin(t) * 10; // Tachycardia
          targetO2 = 88 + Math.sin(t * 0.5) * 2; // Hypoxia
          targetSys = 160 + Math.sin(t) * 5; // Hypertension
          targetDia = 100 + Math.sin(t) * 5;
          targetTemp = 37.2; // Slight elevation
        } else if (patientState === 'post-ictal') {
          targetHR = 95 + Math.sin(t * 0.5) * 5; // Gradual recovery
          targetO2 = 94 + Math.sin(t * 0.2) * 1;
          targetSys = 130;
          targetDia = 85;
          targetTemp = 36.8;
        } else {
          // Normal state: Sine wave baseline + slight noise
          targetHR = 72 + Math.sin(t * 0.1) * 5;
          targetO2 = 98 + Math.sin(t * 0.05) * 1;
          targetSys = 120 + Math.sin(t * 0.1) * 3;
          targetDia = 80 + Math.sin(t * 0.1) * 2;
          targetTemp = 36.5 + Math.sin(t * 0.01) * 0.1;
        }

        // Apply smoothing (low-pass filter) to make transitions realistic
        const alpha = 0.3; // Smoothing factor
        
        // Only simulate HR if watch is not connected
        const newHR = connectionMode === 'watch' ? prev.heartRate : prev.heartRate * (1 - alpha) + (targetHR + (Math.random() * 2 - 1)) * alpha;

        if (connectionMode === 'watch') {
          // Derive other vitals from real heart rate to make them real-time responsive
          targetO2 = Math.max(85, 98 - Math.max(0, (newHR - 80) * 0.1));
          targetSys = 120 + (newHR - 72) * 0.5;
          targetDia = 80 + (newHR - 72) * 0.2;
          targetTemp = 36.5 + (newHR - 72) * 0.005;
        }

        const finalHR = Math.round(newHR);
        const finalO2 = Math.round(prev.o2Sat * (1 - alpha) + (targetO2 + (Math.random() * 1 - 0.5)) * alpha);
        const finalSys = Math.round(prev.systolic * (1 - alpha) + (targetSys + (Math.random() * 2 - 1)) * alpha);
        const finalDia = Math.round(prev.diastolic * (1 - alpha) + (targetDia + (Math.random() * 2 - 1)) * alpha);
        const finalTemp = prev.temperature * (1 - alpha) + (targetTemp + (Math.random() * 0.1 - 0.05)) * alpha;

        return {
          ...prev,
          heartRate: finalHR,
          o2Sat: finalO2,
          systolic: finalSys,
          diastolic: finalDia,
          temperature: finalTemp,
          activeCases: prev.activeCases + (Math.random() > 0.95 ? 1 : 0),
          pendingAlerts: patientState === 'ictal' ? prev.pendingAlerts : Math.max(0, prev.pendingAlerts + (Math.random() > 0.9 ? 1 : (Math.random() > 0.8 ? -1 : 0))),
          history: {
            heartRate: [...prev.history.heartRate.slice(1), finalHR],
            o2Sat: [...prev.history.o2Sat.slice(1), finalO2],
            systolic: [...prev.history.systolic.slice(1), finalSys],
            diastolic: [...prev.history.diastolic.slice(1), finalDia],
            temperature: [...prev.history.temperature.slice(1), finalTemp]
          }
        };
      });

      setNeurological(prev => {
        let targetEeg = 45;
        let targetMovement = 12;

        if (patientState === 'ictal') {
          targetEeg = 95 + Math.sin(t * 2) * 5; // High frequency, high amplitude
          targetMovement = 90 + Math.sin(t * 3) * 10; // Rhythmic convulsions
        } else if (patientState === 'post-ictal') {
          targetEeg = 20 + Math.sin(t * 0.5) * 5; // EEG slowing/suppression
          targetMovement = 5 + Math.random() * 2; // Flaccid/exhausted
        } else {
          targetEeg = 45 + Math.sin(t * 0.2) * 10; // Normal alpha/beta waves
          targetMovement = 12 + Math.sin(t * 0.1) * 5; // Normal fidgeting
        }

        if (connectionMode === 'watch') {
          // Derive from real HR
          targetEeg = 45 + (vitals.heartRate - 72) * 0.5;
          targetMovement = 12 + Math.max(0, (vitals.heartRate - 72) * 0.8);
        }

        const alpha = 0.4;
        const newEeg = prev.eegIndex * (1 - alpha) + (targetEeg + (Math.random() * 5 - 2.5)) * alpha;
        const newMovement = prev.movement * (1 - alpha) + (targetMovement + (Math.random() * 5 - 2.5)) * alpha;

        let risk = 'Low';
        if (patientState === 'ictal') risk = 'ACTIVE';
        else if (patientState === 'post-ictal') risk = 'Recovery';
        else if (newEeg > 75 || newMovement > 80) risk = 'Medium';

        const finalEeg = Math.max(0, Math.min(100, newEeg));
        const finalMovement = Math.max(0, Math.min(100, newMovement));

        return {
          eegIndex: finalEeg,
          movement: finalMovement,
          seizureRisk: risk,
          history: {
            eegIndex: [...prev.history.eegIndex.slice(1), finalEeg],
            movement: [...prev.history.movement.slice(1), finalMovement]
          }
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [patientState, connectionMode]);

  const triggerSeizure = (type: 'Auto' | 'Manual' = 'Manual') => {
    if (patientState === 'warning' || patientState === 'ictal') return;
    
    setPatientState('warning');
    setAlertCountdown(appSettings.countdownSeconds);
    setCurrentSeizureType(type);
    setCurrentSeizureStartTime(Date.now());
  };

  const executeEmergency = () => {
    setPatientState('ictal');
    setSeizureCount(prev => prev + 1);
    setWarningCount(prev => prev + 1);
    setVitals(prev => ({ ...prev, pendingAlerts: prev.pendingAlerts + 1 }));
    setAlertCountdown(null);
  };

  const cancelAlert = () => {
    setPatientState('normal');
    setAlertCountdown(null);
    setCurrentSeizureType(null);
    setCurrentSeizureStartTime(null);
  };

  // Countdown Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (patientState === 'warning' && alertCountdown !== null) {
      if (alertCountdown > 0) {
        timer = setTimeout(() => setAlertCountdown(prev => prev! - 1), 1000);
      } else {
        executeEmergency();
      }
    }
    return () => clearTimeout(timer);
  }, [patientState, alertCountdown]);

  const dismissSeizure = () => {
    setPatientState('post-ictal');
    setEmergencyState('idle');
    setLocation(null);
    setWarningCount(0);
    setVitals(prev => ({ ...prev, pendingAlerts: Math.max(0, prev.pendingAlerts - 1) }));
    
    // Log the seizure
    if (currentSeizureStartTime && currentSeizureType) {
      const duration = Math.round((Date.now() - currentSeizureStartTime) / 1000);
      const newEvent: SeizureEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(currentSeizureStartTime).toISOString(),
        duration,
        type: currentSeizureType
      };
      const newHistory = [newEvent, ...seizureHistory];
      setSeizureHistory(newHistory);
      localStorage.setItem('epiguard-history', JSON.stringify(newHistory));
    }
    
    setCurrentSeizureStartTime(null);
    setCurrentSeizureType(null);

    // Return to normal after 10 seconds of post-ictal state
    setTimeout(() => {
      setPatientState('normal');
    }, 10000);
  };

  const emergencyPhone = "+15550192";
  const mapsLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : '';
  const smsBody = `EMERGENCY: Patient AD is experiencing a seizure. Location: ${mapsLink}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full mb-6 mx-auto">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Welcome to EpiGuard</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              To provide life-saving monitoring and alerts, EpiGuard needs access to a few device features.
            </p>

            <div className="space-y-4 mb-8">
              {/* Bluetooth Permission */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${permissions.bluetooth ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Smartwatch</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monitor vitals</p>
                  </div>
                </div>
                <button 
                  onClick={connectWatch}
                  disabled={permissions.bluetooth || isScanning}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    permissions.bluetooth 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {permissions.bluetooth ? 'Connected' : isScanning ? 'Scanning...' : 'Connect'}
                </button>
              </div>

              {/* Location Permission */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${permissions.location ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Location (GPS)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">For emergency dispatch</p>
                  </div>
                </div>
                <button 
                  onClick={requestLocationPermission}
                  disabled={permissions.location}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    permissions.location 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {permissions.location ? 'Granted' : 'Allow'}
                </button>
              </div>

              {/* Notifications Permission */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${permissions.notifications ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Notifications</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Critical alerts</p>
                  </div>
                </div>
                <button 
                  onClick={requestNotificationPermission}
                  disabled={permissions.notifications}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    permissions.notifications 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {permissions.notifications ? 'Granted' : 'Allow'}
                </button>
              </div>
            </div>

            <button 
              onClick={completeOnboarding}
              className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-semibold transition-colors"
            >
              Continue to Dashboard
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">
              You can always change these settings later. If you skip smartwatch connection, EpiGuard will run in simulation mode.
            </p>
          </div>
        </div>
      )}

      {/* Warning Modal (Countdown) */}
      {patientState === 'warning' && alertCountdown !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-900/90 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300 border-4 border-red-500">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Seizure Detected</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Emergency contacts will be notified in:
            </p>
            <div className="text-8xl font-black text-red-600 dark:text-red-500 mb-8 tabular-nums">
              {alertCountdown}
            </div>
            <div className="space-y-4">
              <button 
                onClick={cancelAlert}
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 py-4 rounded-2xl font-bold text-xl transition-colors shadow-lg"
              >
                I'M OKAY - CANCEL
              </button>
              <button 
                onClick={executeEmergency}
                className="w-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 py-4 rounded-2xl font-bold transition-colors"
              >
                SEND HELP NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setIsSidebarOpen(true); setSidebarView('menu'); }}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">EpiGuard</h1>
        </div>
        <div className="flex items-center gap-4">
          
          {/* Smartwatch Connection Status */}
          <button 
            onClick={connectWatch}
            disabled={isScanning}
            className={`relative p-2 rounded-full transition-colors ${
              connectionMode === 'watch' 
                ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/40' 
                : isScanning
                ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 cursor-wait'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
            }`}
            title={isScanning ? 'Scanning...' : connectionMode === 'watch' ? `Connected: ${watchName}` : 'Connect Smartwatch'}
          >
            {isScanning ? (
              <BluetoothSearching className="w-6 h-6 animate-pulse" />
            ) : connectionMode === 'watch' ? (
              <Watch className="w-6 h-6" />
            ) : (
              <Bluetooth className="w-6 h-6" />
            )}
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button 
            className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            onClick={() => setWarningCount(0)}
          >
            <Bell className="w-5 h-5" />
            {warningCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-800">
                {warningCount}
              </span>
            )}
          </button>
          <div className="relative">
            {userProfile ? (
              <img 
                src={userProfile.image} 
                alt={userProfile.name} 
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 cursor-pointer" 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} 
              />
            ) : (
              <div 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-medium cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <User className="w-5 h-5" />
              </div>
            )}

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {userProfile ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userProfile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userProfile.email}</p>
                    </div>
                    <button 
                      onClick={() => { handleLogout(); setIsProfileDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { handleGoogleLogin(); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sliding Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sliding Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          {sidebarView !== 'menu' ? (
            <button 
              onClick={() => setSidebarView('menu')}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-2">
              <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-lg dark:text-white">Menu</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sidebarView === 'menu' && (
            <div className="space-y-2">
              <button 
                onClick={() => setSidebarView('profile')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                {userProfile ? (
                  <img src={userProfile.image} alt="Profile" className="w-6 h-6 rounded-full" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="font-medium">Profile</span>
              </button>
              <button 
                onClick={() => setSidebarView('settings')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </button>
              {userProfile && (
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-8"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              )}
            </div>
          )}

          {sidebarView === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Emergency Contacts</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Ethio Telecom</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Police</span>
                        <a href="tel:991" className="text-emerald-600 dark:text-emerald-400 font-medium">991</a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Ambulance</span>
                        <a href="tel:902" className="text-emerald-600 dark:text-emerald-400 font-medium">902</a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Fire Emergency</span>
                        <a href="tel:939" className="text-emerald-600 dark:text-emerald-400 font-medium">939</a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Safaricom Ethiopia</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Emergency Line</span>
                        <a href="tel:999" className="text-emerald-600 dark:text-emerald-400 font-medium">999</a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Customer Care</span>
                        <a href="tel:700" className="text-emerald-600 dark:text-emerald-400 font-medium">700</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sidebarView === 'profile' && (
            <div className="flex flex-col items-center justify-center h-full pb-20">
              {userProfile ? (
                <div className="text-center space-y-4 w-full">
                  <img src={userProfile.image} alt={userProfile.name} className="w-24 h-24 rounded-full mx-auto border-4 border-emerald-100 dark:border-emerald-900/30" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userProfile.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{userProfile.email}</p>
                  </div>
                  <div className="pt-8 w-full">
                    <button 
                      onClick={handleLogout}
                      className="w-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 w-full">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to sync your emergency contacts and medical history.</p>
                  </div>
                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-3 shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 hidden md:block transition-colors duration-200">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Activity className="w-5 h-5" />
              Live Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              History Log
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            
            {activeTab === 'dashboard' && (
              <>
                {/* Automated Emergency Protocol Banner */}
                {patientState === 'ictal' && (
                  <div className="mb-6 bg-red-600 text-white p-6 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500 rounded-full animate-pulse">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl mb-1">CRITICAL: Seizure Detected</h3>
                          <p className="text-red-100 text-lg">Patient AD is experiencing a tonic-clonic seizure.</p>
                          
                          {/* Emergency Actions Status */}
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-3 text-sm font-medium bg-red-700/50 px-4 py-2 rounded-lg">
                              <MapPin className="w-5 h-5 text-red-200" />
                              {emergencyState === 'locating' ? 'Acquiring GPS Location...' : `Location Locked: ${location?.lat.toFixed(4)}, ${location?.lng.toFixed(4)}`}
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm font-medium bg-red-700/50 px-4 py-2 rounded-lg">
                              {emergencyState === 'notified' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <PhoneCall className={`w-5 h-5 text-red-200 ${emergencyState === 'calling' ? 'animate-bounce' : ''}`} />
                              )}
                              {emergencyState === 'locating' ? 'Preparing to call emergency contact...' : 
                               emergencyState === 'calling' ? 'Automated System Calling Primary Contact...' : 
                               'Emergency Contact Notified & GPS Sent.'}
                            </div>

                            {/* Manual Override Buttons for Phone */}
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-red-500/50">
                              <a href={`tel:${emergencyPhone}`} className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
                                <PhoneCall className="w-4 h-4" /> Call Contact Now
                              </a>
                              <a href={`sms:${emergencyPhone}?body=${encodeURIComponent(smsBody)}`} className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
                                <MessageSquare className="w-4 h-4" /> Send GPS via SMS
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={dismissSeizure} 
                        className="w-full md:w-auto bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-colors shadow-lg"
                      >
                        Acknowledge & Dismiss
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Live Patient Vitals</h2>
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    {connectionMode === 'watch' ? 'Live Watch Data' : 'Realistic Simulation Active'}
                  </div>
                </div>
            
            {/* Vitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Heart Rate */}
              <div className={`p-6 rounded-xl border shadow-sm transition-all duration-500 ${patientState === 'ictal' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
                      <HeartPulse className="w-6 h-6" />
                    </div>
                    <Sparkline data={vitals.history.heartRate} color="#e11d48" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${patientState === 'ictal' ? 'bg-red-500 text-white' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
                    {patientState === 'ictal' ? 'Tachycardia' : 'Normal'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Heart Rate</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-3xl font-bold tabular-nums transition-colors duration-300 ${patientState === 'ictal' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {vitals.heartRate}
                  </p>
                  <span className="text-sm text-gray-500">bpm</span>
                </div>
              </div>

              {/* Blood Pressure */}
              <div className={`p-6 rounded-xl border shadow-sm transition-all duration-500 ${patientState === 'ictal' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                      <Activity className="w-6 h-6" />
                    </div>
                    <Sparkline data={vitals.history.systolic} color="#9333ea" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${patientState === 'ictal' ? 'bg-red-500 text-white' : 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'}`}>
                    {patientState === 'ictal' ? 'Hypertension' : 'Normal'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Blood Pressure</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-3xl font-bold tabular-nums transition-colors duration-300 ${patientState === 'ictal' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {vitals.systolic}/{vitals.diastolic}
                  </p>
                  <span className="text-sm text-gray-500">mmHg</span>
                </div>
              </div>

              {/* O2 Saturation */}
              <div className={`p-6 rounded-xl border shadow-sm transition-all duration-500 ${patientState === 'ictal' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Droplets className="w-6 h-6" />
                    </div>
                    <Sparkline data={vitals.history.o2Sat} color="#2563eb" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${patientState === 'ictal' ? 'bg-orange-500 text-white' : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'}`}>
                    {patientState === 'ictal' ? 'Hypoxia' : 'Good'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">SpO2</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-3xl font-bold tabular-nums transition-colors duration-300 ${patientState === 'ictal' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                    {vitals.o2Sat}
                  </p>
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              {/* Temperature */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                      <Thermometer className="w-6 h-6" />
                    </div>
                    <Sparkline data={vitals.history.temperature} color="#ea580c" />
                  </div>
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">Normal</span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Temperature</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{vitals.temperature.toFixed(1)}</p>
                  <span className="text-sm text-gray-500">°C</span>
                </div>
              </div>
            </div>

            {/* Neurological Monitoring / Seizure Detection */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Neurological Monitoring</h2>
              <button 
                onClick={() => triggerSeizure('Manual')}
                disabled={patientState === 'warning' || patientState === 'ictal'}
                className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-6 h-6" />
                SOS / HELP
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* EEG Activity */}
              <div className={`p-6 rounded-xl border shadow-sm transition-all duration-500 ${patientState === 'ictal' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Brain className="w-6 h-6" />
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${patientState === 'ictal' ? 'bg-red-500 text-white' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'}`}>
                    {neurological.seizureRisk}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">EEG Activity Index</p>
                <div className="flex items-end justify-between mt-1">
                  <div className="flex items-baseline gap-1">
                    <p className={`text-3xl font-bold tabular-nums transition-colors duration-300 ${patientState === 'ictal' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {neurological.eegIndex.toFixed(0)}
                    </p>
                    <span className="text-sm text-gray-500">/ 100</span>
                  </div>
                  <Sparkline data={neurological.history.eegIndex} color="#4f46e5" className="h-10 w-24 opacity-90" />
                </div>
                {patientState === 'ictal' && (
                  <div className="mt-4 h-2 w-full bg-red-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Movement Index */}
              <div className={`p-6 rounded-xl border shadow-sm transition-all duration-500 ${patientState === 'ictal' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
                      <Zap className="w-6 h-6" />
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${patientState === 'ictal' ? 'bg-red-500 text-white' : 'text-teal-600 bg-teal-50 dark:bg-teal-900/20'}`}>
                    {neurological.seizureRisk}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Movement / Accelerometer</p>
                <div className="flex items-end justify-between mt-1">
                  <div className="flex items-baseline gap-1">
                    <p className={`text-3xl font-bold tabular-nums transition-colors duration-300 ${patientState === 'ictal' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {neurological.movement.toFixed(0)}
                    </p>
                    <span className="text-sm text-gray-500">/ 100</span>
                  </div>
                  <Sparkline data={neurological.history.movement} color="#0d9488" className="h-10 w-24 opacity-90" />
                </div>
                {patientState === 'ictal' && (
                  <div className="mt-4 h-2 w-full bg-red-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
              </>
            )}

            {activeTab === 'history' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Seizure History</h2>
                  <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-full font-medium text-sm">
                    {seizureHistory.length} Events Logged
                  </div>
                </div>
                
                {seizureHistory.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events recorded</h3>
                    <p className="text-gray-500 dark:text-gray-400">Your seizure history will appear here.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {seizureHistory.map((event) => (
                        <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${event.type === 'Auto' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {event.type === 'Auto' ? <Brain className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {event.type === 'Auto' ? 'Auto-Detected Seizure' : 'Manual SOS Trigger'}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(event.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                {event.duration}s
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Duration</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-in fade-in duration-300 max-w-3xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Detection Settings</h2>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Alert Preferences
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Countdown Timer (Seconds)</label>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{appSettings.countdownSeconds}s</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5"
                        value={appSettings.countdownSeconds}
                        onChange={(e) => {
                          const newSettings = { ...appSettings, countdownSeconds: parseInt(e.target.value) };
                          setAppSettings(newSettings);
                          localStorage.setItem('epiguard-settings', JSON.stringify(newSettings));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-red-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">Time to cancel a false alarm before emergency contacts are notified.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Sensitivity Thresholds
                  </h3>
                  
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Heart Rate Threshold (BPM)</label>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{appSettings.hrThreshold}</span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="180" 
                        step="5"
                        value={appSettings.hrThreshold}
                        onChange={(e) => {
                          const newSettings = { ...appSettings, hrThreshold: parseInt(e.target.value) };
                          setAppSettings(newSettings);
                          localStorage.setItem('epiguard-settings', JSON.stringify(newSettings));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Movement Sensitivity</label>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{appSettings.movementThreshold}</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="100" 
                        step="5"
                        value={appSettings.movementThreshold}
                        onChange={(e) => {
                          const newSettings = { ...appSettings, movementThreshold: parseInt(e.target.value) };
                          setAppSettings(newSettings);
                          localStorage.setItem('epiguard-settings', JSON.stringify(newSettings));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">EEG Activity Threshold</label>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{appSettings.eegThreshold}</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="100" 
                        step="5"
                        value={appSettings.eegThreshold}
                        onChange={(e) => {
                          const newSettings = { ...appSettings, eegThreshold: parseInt(e.target.value) };
                          setAppSettings(newSettings);
                          localStorage.setItem('epiguard-settings', JSON.stringify(newSettings));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
