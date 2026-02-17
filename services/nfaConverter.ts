
import { Automaton, Transition, EpsilonClosureMap } from '../types';

/**
 * Computes the epsilon closure for a single state.
 */
export function computeStateEpsilonClosure(
  state: string,
  transitions: Transition[]
): string[] {
  const closure = new Set<string>([state]);
  const stack = [state];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const epsilonMoves = transitions
      .filter((t) => t.from === current && (t.symbol === "" || t.symbol === "ε"))
      .map((t) => t.to);

    for (const next of epsilonMoves) {
      if (!closure.has(next)) {
        closure.add(next);
        stack.push(next);
      }
    }
  }

  return Array.from(closure).sort();
}

/**
 * Computes epsilon closures for all states in the automaton.
 */
export function computeAllEpsilonClosures(enfa: Automaton): EpsilonClosureMap {
  const map: EpsilonClosureMap = {};
  enfa.states.forEach((state) => {
    map[state] = computeStateEpsilonClosure(state, enfa.transitions);
  });
  return map;
}

/**
 * Main conversion function following the 4 steps:
 * 1. Compute ε-closure
 * 2. New transition function δ'
 * 3. New final states F'
 * 4. Remove ε transitions
 */
export function convertENFAToNFA(enfa: Automaton): { nfa: Automaton; closures: EpsilonClosureMap } {
  const closures = computeAllEpsilonClosures(enfa);
  const newTransitions: Transition[] = [];
  const alphabetWithoutEpsilon = enfa.alphabet.filter(a => a !== "" && a !== "ε");

  // Step 2 & 4: New transition function δ'(q, a) = ε-closure(∪_{p ∈ ε-closure(q)} δ(p, a))
  // We iterate through every state and every non-epsilon symbol
  for (const q of enfa.states) {
    for (const a of alphabetWithoutEpsilon) {
      const qClosure = closures[q];
      const reachedAfterSymbol = new Set<string>();

      // For each p in ε-closure(q), find where symbol 'a' takes us
      for (const p of qClosure) {
        enfa.transitions
          .filter(t => t.from === p && t.symbol === a)
          .forEach(t => reachedAfterSymbol.add(t.to));
      }

      // From all states reached by 'a', apply ε-closure again
      const finalReached = new Set<string>();
      reachedAfterSymbol.forEach(s => {
        closures[s].forEach(c => finalReached.add(c));
      });

      // Add these as new transitions in the NFA
      finalReached.forEach(target => {
        // Prevent duplicates
        if (!newTransitions.find(t => t.from === q && t.to === target && t.symbol === a)) {
          newTransitions.push({ from: q, to: target, symbol: a });
        }
      });
    }
  }

  // Step 3: New final states F' = {q | ε-closure(q) ∩ F ≠ ∅}
  const newFinalStates = enfa.states.filter(q => {
    const qClosure = closures[q];
    return qClosure.some(s => enfa.finalStates.includes(s));
  });

  return {
    nfa: {
      states: enfa.states,
      alphabet: alphabetWithoutEpsilon,
      transitions: newTransitions,
      initialState: enfa.initialState,
      finalStates: newFinalStates
    },
    closures
  };
}
