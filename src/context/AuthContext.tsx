import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateFirebaseUserProfile,
  firebaseSignOut,
  onAuthStateChanged,
  saveProfileToFirestore,
  fetchProfileFromFirestore,
  testFirestoreConnection,
} from '../services/firebase';

export const getRealFormattedRegistrationDate = (timestampOrDateStr?: string | number | null): string => {
  if (timestampOrDateStr) {
    const d = new Date(timestampOrDateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const DEFAULT_INITIAL_SETTINGS: Omit<UserProfile, 'id' | 'name' | 'email'> = {
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  accountTier: 'PRO TRADER',
  memberSince: getRealFormattedRegistrationDate(),
  registeredAtTimestamp: Date.now(),
  tradingStyle: 'Macro Swing',
  primaryCurrency: 'USD',
  riskPreference: 'Standard (1% - 2%)',
  riskSettings: {
    maxDailyLossPercent: 3.0,
    targetRiskReward: '1:2.5',
    maxConcurrentTrades: 3,
    preferredSessions: ['London', 'New York'],
    accountBalance: 25000,
    riskPerTradePercent: 1.5,
  },
  watchlists: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'USD/CAD'],
  notes: 'Focus on US CPI core inflation releases, FOMC dot plots, and Non-Farm Payroll deviation strategies.',
  alerts: {
    highImpactAudio: true,
    instantPopups: true,
    dailySummary: true,
    emailAlerts: false,
    soundVolume: 80,
    watchlistOnly: false,
  },
  stats: {
    totalSignalsEvaluated: 0,
    winRateEst: 74.0,
    activeWatchlistCount: 5,
    lastLogin: 'Just now',
    totalSandboxesRun: 0,
    favoritePair: 'EUR/USD',
  },
  isVerified: true,
};

export const sanitizeUserProfile = (profile: any, fbUser?: any): UserProfile => {
  const isOutdatedDate = !profile?.memberSince || profile.memberSince === 'March 2024' || profile.memberSince.includes('2024');
  
  let realMemberSince = profile?.memberSince;
  let realTimestamp = profile?.registeredAtTimestamp;

  if (fbUser?.metadata?.creationTime) {
    realMemberSince = getRealFormattedRegistrationDate(fbUser.metadata.creationTime);
    realTimestamp = new Date(fbUser.metadata.creationTime).getTime();
  } else if (isOutdatedDate) {
    realMemberSince = getRealFormattedRegistrationDate();
    realTimestamp = Date.now();
  }

  const realEmail = fbUser?.email || profile?.email || '';
  const realName = fbUser?.displayName || profile?.name || (realEmail ? realEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Trader');
  const realId = fbUser?.uid || profile?.id || '';

  return {
    ...DEFAULT_INITIAL_SETTINGS,
    ...profile,
    id: realId,
    name: realName,
    email: realEmail,
    avatarUrl: fbUser?.photoURL || profile?.avatarUrl || DEFAULT_INITIAL_SETTINGS.avatarUrl,
    memberSince: realMemberSince || DEFAULT_INITIAL_SETTINGS.memberSince,
    registeredAtTimestamp: realTimestamp || Date.now(),
    isVerified: fbUser?.emailVerified ?? (profile?.isVerified ?? true),
    riskSettings: {
      ...DEFAULT_INITIAL_SETTINGS.riskSettings,
      ...(profile?.riskSettings || {}),
    },
    alerts: {
      ...DEFAULT_INITIAL_SETTINGS.alerts,
      ...(profile?.alerts || {}),
    },
    stats: {
      ...DEFAULT_INITIAL_SETTINGS.stats,
      ...(profile?.stats || {}),
      favoritePair: profile?.stats?.favoritePair || profile?.watchlists?.[0] || 'EUR/USD',
      activeWatchlistCount: (profile?.watchlists || DEFAULT_INITIAL_SETTINGS.watchlists).length,
    },
    watchlists: Array.isArray(profile?.watchlists) && profile.watchlists.length > 0 ? profile.watchlists : DEFAULT_INITIAL_SETTINGS.watchlists,
  };
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'otivo_authenticated_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Never start with a demo user. Only read from cache if valid user session exists.
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.email) {
          return sanitizeUserProfile(parsed);
        }
      }
    } catch {}
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);

  // Initialize and listen to real Firebase Auth lifecycle
  useEffect(() => {
    testFirestoreConnection().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Authenticated user exists - fetch all saved settings from Firestore
        try {
          const remoteProfile = await fetchProfileFromFirestore(fbUser.uid);
          if (remoteProfile) {
            // Profile exists on Firestore across devices - restore full settings
            const sanitized = sanitizeUserProfile(remoteProfile, fbUser);
            setUser(sanitized);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            } catch {}
          } else {
            // New user account - create fresh persistent profile in Firestore
            const newProfile: UserProfile = sanitizeUserProfile({
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Trader',
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || DEFAULT_INITIAL_SETTINGS.avatarUrl,
              stats: {
                ...DEFAULT_INITIAL_SETTINGS.stats,
                lastLogin: 'Today via Firebase Auth',
              },
              isVerified: fbUser.emailVerified ?? true,
            }, fbUser);

            setUser(newProfile);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
            } catch {}
            await saveProfileToFirestore(newProfile).catch(() => {});
          }
        } catch (err) {
          console.error('Error synchronizing profile from Firestore:', err);
        }
      } else {
        // Not authenticated in Firebase Auth - enforce unauthenticated state
        setUser(null);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update profile locally and sync to Firestore
  const updateProfile = async (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated: UserProfile = sanitizeUserProfile({
        ...prev,
        ...updates,
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      saveProfileToFirestore(updated).catch((err) => {
        console.warn('Failed to sync profile update to Firestore:', err);
      });
      return updated;
    });
  };

  // Real Email/Password Login
  const login = async (email: string, pass: string): Promise<boolean> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = cred.user;

    // Load user's profile from Firestore to restore all cross-device settings
    const remoteProfile = await fetchProfileFromFirestore(fbUser.uid);
    let fullProfile: UserProfile;

    if (remoteProfile) {
      fullProfile = sanitizeUserProfile(remoteProfile, fbUser);
    } else {
      fullProfile = sanitizeUserProfile({
        id: fbUser.uid,
        name: fbUser.displayName || email.trim().split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: fbUser.email || email.trim(),
        stats: {
          ...DEFAULT_INITIAL_SETTINGS.stats,
          lastLogin: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      }, fbUser);
      await saveProfileToFirestore(fullProfile).catch(() => {});
    }

    setUser(fullProfile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullProfile));
    } catch {}

    setAuthModalOpen(false);
    return true;
  };

  // Real Email/Password Sign Up
  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = cred.user;

    if (name.trim()) {
      try {
        await updateFirebaseUserProfile(fbUser, { displayName: name.trim() });
      } catch {}
    }

    const newProfile: UserProfile = sanitizeUserProfile({
      id: fbUser.uid,
      name: name.trim() || email.trim().split('@')[0],
      email: fbUser.email || email.trim(),
      memberSince: getRealFormattedRegistrationDate(),
      registeredAtTimestamp: Date.now(),
      stats: {
        ...DEFAULT_INITIAL_SETTINGS.stats,
        totalSignalsEvaluated: 0,
        lastLogin: 'Just now (New Account)',
      },
      isVerified: fbUser.emailVerified ?? false,
    }, fbUser);

    setUser(newProfile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch {}

    await saveProfileToFirestore(newProfile).catch(() => {});
    setAuthModalOpen(false);
    return true;
  };

  // Real Google Sign In
  const loginWithGoogle = async (): Promise<boolean> => {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    
    // Fetch profile from Firestore to restore settings across devices
    const remoteProfile = await fetchProfileFromFirestore(fbUser.uid);
    let profile: UserProfile;

    if (remoteProfile) {
      profile = sanitizeUserProfile(remoteProfile, fbUser);
    } else {
      profile = sanitizeUserProfile({
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || DEFAULT_INITIAL_SETTINGS.avatarUrl,
        accountTier: 'PRO TRADER',
        stats: {
          ...DEFAULT_INITIAL_SETTINGS.stats,
          lastLogin: 'Just now via Google SSO',
        },
        isVerified: fbUser.emailVerified ?? true,
      }, fbUser);
      await saveProfileToFirestore(profile).catch(() => {});
    }

    setUser(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}

    setAuthModalOpen(false);
    return true;
  };

  // Password reset email
  const resetPassword = async (email: string): Promise<void> => {
    if (!email || !email.trim()) {
      throw new Error('Please enter a valid email address');
    }
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Sign out
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setProfileModalOpen(false);
    setAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        logout,
        updateProfile,
        isAuthModalOpen,
        setAuthModalOpen,
        isProfileModalOpen,
        setProfileModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
