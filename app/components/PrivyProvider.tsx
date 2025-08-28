"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { useAppConfig } from "./AppConfigProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const env = useAppConfig();

  if (!env.NEXT_PUBLIC_PRIVY_APP_ID) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set.");
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethodsAndOrder: {
          primary: [`privy:${env.NEXT_PUBLIC_MONAD_APP_ID}`],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
