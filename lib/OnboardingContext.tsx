/**
 * OnboardingContext for Uccara app
 * Manages onboarding state and user intent preferences
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@uccara/onboarding_completed';
const ONBOARDING_OLD_KEY = '@uccara/onboarding_complete'; // legacy key used in onboarding screen
const USER_INTENT_KEY = '@uccara/user_intent';

export type UserIntent = 'learning' | 'meditation' | 'daily_practice';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  userIntent: UserIntent | null;
  isLoading: boolean;
  setUserIntent: (intent: UserIntent) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [userIntent, setUserIntentState] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved state on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const [completedValue, intentValue] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY),
          AsyncStorage.getItem(USER_INTENT_KEY),
        ]);

        let isComplete = completedValue === 'true';

        // Migrate from old key if current key has no value
        if (!isComplete) {
          const oldValue = await AsyncStorage.getItem(ONBOARDING_OLD_KEY);
          if (oldValue === 'true') {
            isComplete = true;
            // Migrate to correct key and remove old one
            await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
            await AsyncStorage.removeItem(ONBOARDING_OLD_KEY);
          }
        }

        setIsOnboardingComplete(isComplete);
        if (intentValue) {
          setUserIntentState(intentValue as UserIntent);
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingState();
  }, []);

  const setUserIntent = useCallback(async (intent: UserIntent) => {
    try {
      await AsyncStorage.setItem(USER_INTENT_KEY, intent);
      setUserIntentState(intent);
    } catch (error) {
      console.error('Error saving user intent:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY),
        AsyncStorage.removeItem(USER_INTENT_KEY),
      ]);
      setIsOnboardingComplete(false);
      setUserIntentState(null);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }, []);

  const value: OnboardingContextType = {
    isOnboardingComplete,
    userIntent,
    isLoading,
    setUserIntent,
    completeOnboarding,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
