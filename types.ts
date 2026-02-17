
export interface Transition {
  from: string;
  to: string;
  symbol: string; // Empty string "" denotes epsilon (ε)
}

export interface Automaton {
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  initialState: string;
  finalStates: string[];
}

export interface EpsilonClosureMap {
  [state: string]: string[];
}

export const EPSILON = "ε";
