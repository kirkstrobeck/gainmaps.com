// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_APPEARANCE,
  readAppearance,
  settle,
  writeAppearance,
  type Appearance,
  type Mode,
  type Ultra,
} from "@/lib/appearance";

type AppearanceContextValue = Appearance & {
  setMode: (mode: Mode) => void;
  setUltra: (ultra: Ultra) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

/*
  React's copy of the state that the boot script already stamped on <html>.

  The server renders the defaults, so the first client render must match them —
  the real values are read in an effect, one tick later. Nothing visual depends
  on that tick: the page's colours come from the attributes, which were correct
  before paint. Only the controls' own rendering follows this state.
*/
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [adopted, setAdopted] = useState(false);

  useEffect(() => {
    setAppearance(readAppearance());
    setAdopted(true);
  }, []);

  // Writing is a side effect of the state, never of the setter, so the updaters
  // below stay pure and survive Strict Mode's double invocation.
  useEffect(() => {
    if (!adopted) return;
    writeAppearance(appearance);
  }, [appearance, adopted]);

  const setMode = useCallback((mode: Mode) => {
    setAppearance((current) => settle({ ...current, mode }));
  }, []);

  const setUltra = useCallback((ultra: Ultra) => {
    setAppearance((current) => settle({ ...current, ultra }));
  }, []);

  const value = useMemo<AppearanceContextValue>(
    () => ({ ...appearance, setMode, setUltra }),
    [appearance, setMode, setUltra],
  );

  return <AppearanceContext value={value}>{children}</AppearanceContext>;
}

export function useAppearance(): AppearanceContextValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance must be used inside AppearanceProvider");
  return value;
}
