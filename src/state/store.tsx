import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AppState } from "../engine/types";
import { initialState, parseState } from "./model";
const KEY = "wordrush.state.v1";
const Context = createContext<null | {
  state: AppState;
  ready: boolean;
  error: string;
  update: (fn: (s: AppState) => AppState) => void;
  retry: () => void;
}>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const current = useRef(state);
  const queue = useRef(Promise.resolve());
  const load = () => {
    setError("");
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const saved = parseState(raw);
        current.current = saved;
        setState(saved);
        setReady(true);
      })
      .catch(() => setError("לא הצלחנו לקרוא את ההתקדמות. נסו שוב."));
  };
  useEffect(load, []);
  const persist = (next: AppState) => {
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)))
      .then(() => setError(""))
      .catch(() =>
        setError("ההתקדמות עדיין לא נשמרה. נסו לשמור שוב לפני היציאה."),
      );
  };
  const update = (fn: (s: AppState) => AppState) => {
    if (!ready) return;
    const next = fn(current.current);
    current.current = next;
    setState(next);
    persist(next);
  };
  return (
    <Context.Provider
      value={{
        state,
        ready,
        error,
        update,
        retry: () => (ready ? persist(current.current) : load()),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider missing");
  return value;
}
