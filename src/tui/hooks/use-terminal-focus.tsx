import { useState, useEffect, createContext, useContext } from "react";
import { setFocusChangeListener } from "./focus-filter.js";

const TerminalFocusContext = createContext<boolean>(true);

export function TerminalFocusProvider({ children }: { children: React.ReactNode }) {
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    process.stdout.write("\x1b[?1004h");
    setFocusChangeListener((f) => setFocused(f));

    return () => {
      process.stdout.write("\x1b[?1004l\x1b[0 q");
      setFocusChangeListener(null);
    };
  }, []);

  return (
    <TerminalFocusContext.Provider value={focused}>
      {children}
    </TerminalFocusContext.Provider>
  );
}

export function useTerminalFocus(): boolean {
  return useContext(TerminalFocusContext);
}
