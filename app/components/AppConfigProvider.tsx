"use client";
import { createContext, useContext, useEffect, useState } from 'react';

interface EnvVars {
  NEXT_PUBLIC_PRIVY_APP_ID: string;
  NEXT_PUBLIC_MONAD_APP_ID: string;
  NEXT_PUBLIC_MONAD_PORTAL_URL: string;
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_GAME_ADDRESS: string;
  NEXT_PUBLIC_DISABLE_BACKEND: string;
}

const AppConfigContext = createContext<EnvVars | null>(null);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [env, setEnv] = useState<EnvVars | null>(null);

  useEffect(() => {
    fetch('/api/env')
      .then(res => res.json())
      .then(data => {
        setEnv(data);
      })
      .catch(error => {
        // Fallback to process.env for development
        setEnv({
          NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
          NEXT_PUBLIC_MONAD_APP_ID: process.env.NEXT_PUBLIC_MONAD_APP_ID || '',
          NEXT_PUBLIC_MONAD_PORTAL_URL: process.env.NEXT_PUBLIC_MONAD_PORTAL_URL || '',
          NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
          NEXT_PUBLIC_GAME_ADDRESS: process.env.NEXT_PUBLIC_GAME_ADDRESS || '',
          NEXT_PUBLIC_DISABLE_BACKEND: process.env.NEXT_PUBLIC_DISABLE_BACKEND || '',
        });
      });
  }, []);

  if (!env) return <div>Loading environment variables...</div>;

  return (
    <AppConfigContext.Provider value={env}>
      {children}
    </AppConfigContext.Provider>
  );
}

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};
