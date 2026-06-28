"use client";

import React, { createContext, useContext, useState } from "react";

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Create the context
const AppContext = createContext<AppState>({
  sidebarOpen: true,
  setSidebarOpen: () => { },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AppContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);


