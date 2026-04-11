// context/GameContext.tsx
// État global : progression, découvertes, carnet

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

// ─── Types ───────────────────────────────────────────────────
export type Discovery = {
  id: string;
  type: 'clue' | 'evidence' | 'location' | 'person' | 'object';
  title: string;
  layer:'investigation' | 'treasure';
  content: string;
  emoji: string;
  sceneId?: string;
  timestamp: number;
  lat?: number;
  lng?: number;
};

export type GameState = {
  // Scènes débloquées
  unlockedScenes: string[];
  // Objets/indices cliqués
  clickedHotspots: Record<string, boolean>;
  // Découvertes auto-enregistrées dans le carnet
  discoveries: Discovery[];
  // Notes libres du joueur
  playerNotes: { id: string; text: string; ts: number }[];
  // Marqueurs posés sur la carte
  mapMarkers: { id: string; lat: number; lng: number; label: string; color: string }[];
  loaded: boolean;
};

type Action =
  | { type: 'LOAD'; payload: Partial<GameState> }
  | { type: 'RESET' }
  | { type: 'CLICK_HOTSPOT'; payload: string }
  | { type: 'UNLOCK_SCENE'; payload: string }
  | { type: 'ADD_DISCOVERY'; payload: Discovery }
  | { type: 'ADD_NOTE'; payload: string }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'ADD_MAP_MARKER'; payload: Omit<GameState['mapMarkers'][0], 'id'> }
  | { type: 'DELETE_MAP_MARKER'; payload: string };

// ─── État initial ─────────────────────────────────────────────
const initial: GameState = {
  unlockedScenes: ['scene_appartement'],   // première scène toujours dispo
  clickedHotspots: {},
  discoveries: [],
  playerNotes: [],
  mapMarkers: [],
  loaded: false,
};

// ─── Reducer ──────────────────────────────────────────────────
function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, ...action.payload, loaded: true };
    case 'RESET':
      return { ...initial, loaded: true };

    case 'CLICK_HOTSPOT':
      return { ...state, clickedHotspots: { ...state.clickedHotspots, [action.payload]: true } };

    case 'UNLOCK_SCENE':
      if (state.unlockedScenes.includes(action.payload)) return state;
      return { ...state, unlockedScenes: [...state.unlockedScenes, action.payload] };

    case 'ADD_DISCOVERY':
      if (state.discoveries.find(d => d.id === action.payload.id)) return state;
      return { ...state, discoveries: [action.payload, ...state.discoveries] };

    case 'ADD_NOTE':
      return {
        ...state,
        playerNotes: [
          { id: Date.now().toString(), text: action.payload, ts: Date.now() },
          ...state.playerNotes,
        ],
      };

    case 'DELETE_NOTE':
      return { ...state, playerNotes: state.playerNotes.filter(n => n.id !== action.payload) };

    case 'ADD_MAP_MARKER':
      return {
        ...state,
        mapMarkers: [
          ...state.mapMarkers,
          { ...action.payload, id: Date.now().toString() },
        ],
      };

    case 'DELETE_MAP_MARKER':
      return { ...state, mapMarkers: state.mapMarkers.filter(m => m.id !== action.payload) };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────
const Ctx = createContext<{ state: GameState; dispatch: React.Dispatch<Action> } | null>(null);

const SAVE_KEY = '@codex_save_v1';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY)
      .then(raw => dispatch({ type: 'LOAD', payload: raw ? JSON.parse(raw) : {} }))
      .catch(() => dispatch({ type: 'LOAD', payload: {} }));
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    const { loaded, ...save } = state;
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify(save)).catch(console.error);
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
