"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ImpersonationState = {
  impersonatingUser: { id: string; name: string } | null;
  startImpersonation: (user: { id: string; name: string }) => void;
  stopImpersonation: () => void;
};

const ImpersonationContext = createContext<ImpersonationState | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatingUser, setImpersonatingUser] = useState<{ id: string; name: string } | null>(null);

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatingUser,
        startImpersonation: (user) => setImpersonatingUser(user),
        stopImpersonation: () => setImpersonatingUser(null),
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error("useImpersonation must be used within ImpersonationProvider");
  return ctx;
}
