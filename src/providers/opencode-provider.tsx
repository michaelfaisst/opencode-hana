/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import { opencodeClient } from "@/lib/opencode";

type OpencodeClient = typeof opencodeClient;

const OpencodeContext = createContext<OpencodeClient | null>(null);

export function OpencodeProvider({ children }: { children: ReactNode }) {
  return (
    <OpencodeContext.Provider value={opencodeClient}>
      {children}
    </OpencodeContext.Provider>
  );
}

export function useOpencodeClient() {
  const client = useContext(OpencodeContext);
  if (!client) {
    throw new Error("useOpencodeClient must be used within an OpencodeProvider");
  }
  return client;
}
