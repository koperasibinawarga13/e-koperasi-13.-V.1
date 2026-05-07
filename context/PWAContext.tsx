import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  installPromptEvent: BeforeInstallPromptEvent | null;
  isAppInstalled: boolean;
  triggerInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const checkInstallState = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isSafariStandalone = (window.navigator as any).standalone === true;
      setIsAppInstalled(isStandalone || isSafariStandalone);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPromptEvent(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener?.('change', checkInstallState);
    checkInstallState();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener?.('change', checkInstallState);
    };
  }, []);

  const triggerInstallPrompt = async () => {
    if (!installPromptEvent) {
      return;
    }
    // Show the install prompt
    installPromptEvent.prompt();
    // Wait for the user to respond to the prompt
    await installPromptEvent.userChoice;
    // We've used the prompt, and can't use it again, so clear it
    setInstallPromptEvent(null);
  };

  return (
    <PWAContext.Provider value={{ installPromptEvent, isAppInstalled, triggerInstallPrompt }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};