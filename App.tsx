
import React, { useState, useMemo } from 'react';
import { Automaton, Transition, EPSILON } from './types';
import { convertENFAToNFA } from './services/nfaConverter';
import AutomatonVisualizer from './components/AutomatonVisualizer';

const INITIAL_ENFA: Automaton = {
  states: ['A', 'B', 'C'],
  alphabet: ['0', '1', 'ε'],
  transitions: [
    { from: 'A', to: 'A', symbol: '0' },
    { from: 'A', to: 'B', symbol: 'ε' },
    { from: 'B', to: 'B', symbol: '1' },
    { from: 'B', to: 'C', symbol: 'ε' },
    { from: 'C', to: 'C', symbol: '0' },
  ],
  initialState: 'A',
  finalStates: ['C'],
};

const EMPTY_ENFA: Automaton = {
  states: ['A'],
  alphabet: ['ε'],
  transitions: [],
  initialState: 'A',
  finalStates: [],
};

const App: React.FC = () => {
  const [enfa, setEnfa] = useState<Automaton>(INITIAL_ENFA);
  const [activeTab, setActiveTab] = useState<'visual' | 'logic'>('visual');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  
  // Transition Form State
  const [newTrans, setNewTrans] = useState<Transition>({ from: '', to: '', symbol: '' });
  const [newStateName, setNewStateName] = useState('');
  const [newSymbolName, setNewSymbolName] = useState('');

  const { nfa, closures } = useMemo(() => convertENFAToNFA(enfa), [enfa]);

  const addTransition = () => {
    if (newTrans.from && newTrans.to && (newTrans.symbol !== undefined)) {
      setEnfa(prev => ({
        ...prev,
        transitions: [...prev.transitions, { ...newTrans }]
      }));
      setNewTrans({ from: '', to: '', symbol: '' });
    }
  };

  const removeTransition = (idx: number) => {
    setEnfa(prev => ({
      ...prev,
      transitions: prev.transitions.filter((_, i) => i !== idx)
    }));
  };

  const addState = () => {
    if (newStateName && !enfa.states.includes(newStateName)) {
      setEnfa(prev => ({ ...prev, states: [...prev.states, newStateName] }));
      setNewStateName('');
    }
  };

  const removeState = (state: string) => {
    setEnfa(prev => ({
      ...prev,
      states: prev.states.filter(s => s !== state),
      finalStates: prev.finalStates.filter(s => s !== state),
      initialState: prev.initialState === state ? (prev.states[0] || '') : prev.initialState,
      transitions: prev.transitions.filter(t => t.from !== state && t.to !== state)
    }));
  };

  const addSymbol = () => {
    if (newSymbolName && !enfa.alphabet.includes(newSymbolName)) {
      setEnfa(prev => ({ ...prev, alphabet: [...prev.alphabet, newSymbolName] }));
      setNewSymbolName('');
    }
  };

  const removeSymbol = (symbol: string) => {
    if (symbol === 'ε') return; // Keep epsilon
    setEnfa(prev => ({
      ...prev,
      alphabet: prev.alphabet.filter(a => a !== symbol),
      transitions: prev.transitions.filter(t => t.symbol !== symbol)
    }));
  };

  const toggleFinalState = (state: string) => {
    setEnfa(prev => ({
      ...prev,
      finalStates: prev.finalStates.includes(state)
        ? prev.finalStates.filter(s => s !== state)
        : [...prev.finalStates, state]
    }));
  };

  const setInitialState = (state: string) => {
    setEnfa(prev => ({ ...prev, initialState: state }));
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.states && parsed.alphabet && parsed.transitions && parsed.initialState && parsed.finalStates) {
        setEnfa(parsed);
        setShowJsonInput(false);
        setJsonInput('');
      } else {
        alert("Invalid Automaton format. Required: states, alphabet, transitions, initialState, finalStates.");
      }
    } catch (e) {
      alert("Invalid JSON string.");
    }
  };

  const exportState = () => {
    setJsonInput(JSON.stringify(enfa, null, 2));
    setShowJsonInput(true);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire automaton? This will remove all states and transitions.")) {
      setEnfa(EMPTY_ENFA);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <header className="max-w-7xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
          <i className="fas fa-project-diagram text-blue-600"></i>
          ε-NFA to NFA Converter
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto text-lg">
          Master the ε-closure algorithm. Design your ε-NFA and visualize the automated NFA conversion step-by-step.
        </p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Controls */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-cog text-blue-500"></i> Configuration
              </h2>
              <div className="flex gap-3">
                <button 
                  onClick={exportState}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                >
                  <i className="fas fa-file-import"></i> JSON
                </button>
                <button 
                  onClick={handleClearAll}
                  className="text-xs font-bold text-red-500 hover:text-red-700 underline flex items-center gap-1"
                >
                  <i className="fas fa-trash-alt"></i> Clear All
                </button>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* Initial State Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start State (q₀)</label>
                <select 
                  value={enfa.initialState}
                  onChange={(e) => setInitialState(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-blue-600"
                >
                  {enfa.states.length > 0 ? (
                    enfa.states.map(s => <option key={s} value={s}>{s}</option>)
                  ) : (
                    <option value="">No states available</option>
                  )}
                </select>
              </div>

              {/* States Management */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">States (Q)</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" value={newStateName} onChange={e => setNewStateName(e.target.value)}
                    placeholder="New State..." className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addState()}
                  />
                  <button onClick={addState} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {enfa.states.map(s => (
                    <span key={s} className="group relative flex items-center bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold border border-slate-200">
                      {s}
                      <button onClick={() => removeState(s)} className="ml-1 text-slate-400 hover:text-red-500"><i className="fas fa-times"></i></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Alphabet Management */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alphabet (Σ)</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" value={newSymbolName} onChange={e => setNewSymbolName(e.target.value)}
                    placeholder="New Symbol..." className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
                  />
                  <button onClick={addSymbol} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {enfa.alphabet.map(a => (
                    <span key={a} className="flex items-center bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold border border-slate-200">
                      {a || 'ε'}
                      {a !== 'ε' && (
                        <button onClick={() => removeSymbol(a)} className="ml-1 text-slate-400 hover:text-red-500"><i className="fas fa-times"></i></button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Transitions Management */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Add Transition (δ)</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <select 
                    value={newTrans.from} onChange={e => setNewTrans(prev => ({...prev, from: e.target.value}))}
                    className="px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Origin</option>
                    {enfa.states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select 
                    value={newTrans.symbol} onChange={e => setNewTrans(prev => ({...prev, symbol: e.target.value}))}
                    className="px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Sym</option>
                    {enfa.alphabet.map(a => <option key={a} value={a}>{a || 'ε'}</option>)}
                  </select>
                  <select 
                    value={newTrans.to} onChange={e => setNewTrans(prev => ({...prev, to: e.target.value}))}
                    className="px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Dest</option>
                    {enfa.states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button 
                  onClick={addTransition}
                  disabled={!newTrans.from || !newTrans.to}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  Confirm Transition
                </button>
              </div>

              <hr className="border-slate-100" />

              {/* Final States Management */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Accepting States (F)</label>
                <div className="flex flex-wrap gap-2">
                  {enfa.states.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleFinalState(s)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        enfa.finalStates.includes(s) 
                          ? 'bg-red-50 text-red-600 border-red-200 ring-2 ring-red-100' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s} {enfa.finalStates.includes(s) && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* JSON Overlay / Input */}
          {showJsonInput && (
            <div className="bg-blue-50 p-6 rounded-2xl shadow-inner border-2 border-dashed border-blue-200 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-blue-800 tracking-tight">Bulk Input / Output</h3>
                <button onClick={() => setShowJsonInput(false)} className="text-blue-500 hover:text-blue-700"><i className="fas fa-times"></i></button>
              </div>
              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-48 p-3 bg-white border border-blue-200 rounded-xl text-xs font-mono mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder='Paste ε-NFA JSON here...'
              />
              <button 
                onClick={handleJsonImport}
                className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md"
              >
                Apply Entire State
              </button>
            </div>
          )}

          {/* Transition List */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              Active Transitions
              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{enfa.transitions.length}</span>
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {enfa.transitions.length === 0 && <p className="text-center text-slate-400 py-4 text-sm italic">No transitions added yet.</p>}
              {enfa.transitions.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                  <span className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{t.from}</span>
                    <span className="mx-2 text-slate-400">─({t.symbol || 'ε'})─▶</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{t.to}</span>
                  </span>
                  <button onClick={() => removeTransition(i)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Output Visualizer & Logic */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit shadow-inner">
            <button 
              onClick={() => setActiveTab('visual')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'visual' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Interactive Diagrams
            </button>
            <button 
              onClick={() => setActiveTab('logic')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'logic' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Algorithm Analysis
            </button>
          </div>

          {activeTab === 'visual' ? (
            <div className="flex flex-col gap-10">
              <AutomatonVisualizer id="enfa" title="Phase 1: Your Input ε-NFA" automaton={enfa} />
              <div className="flex justify-center">
                <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg animate-bounce">
                  <i className="fas fa-arrow-down"></i>
                </div>
              </div>
              <AutomatonVisualizer id="nfa" title="Phase 2: Converted Resulting NFA" automaton={nfa} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Closures Table */}
              <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                   <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                   ε-Closure Computation
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-xs font-bold">
                      <tr>
                        <th className="px-6 py-4 border-b">State (q)</th>
                        <th className="px-6 py-4 border-b">Epsilon Closure [ ε-closure(q) ]</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.entries(closures) as [string, string[]][]).map(([state, closure]) => (
                        <tr key={state} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-600 text-base">{state}</td>
                          <td className="px-6 py-4">
                            <span className="flex flex-wrap gap-2">
                              {closure.map(s => (
                                <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-semibold shadow-sm">{s}</span>
                              ))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transition Table */}
              <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                   <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                   Final State-Transition Map
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-xs font-bold">
                      <tr>
                        <th className="px-6 py-4 border border-slate-200">State</th>
                        {nfa.alphabet.map(a => (
                          <th key={a} className="px-6 py-4 border border-slate-200 text-center">δ' (q, {a})</th>
                        ))}
                        <th className="px-6 py-4 border border-slate-200 text-center">Accepting?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nfa.states.map(state => (
                        <tr key={state} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 border border-slate-200 font-bold bg-slate-50/50">
                            {state} {state === nfa.initialState && <span className="text-blue-500 ml-2" title="Initial State">➔</span>}
                          </td>
                          {nfa.alphabet.map(a => {
                            const targets: string[] = nfa.transitions
                              .filter(t => t.from === state && t.symbol === a)
                              .map(t => t.to);
                            return (
                              <td key={a} className="px-6 py-4 border border-slate-200 text-center">
                                {targets.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 justify-center">
                                    {targets.map(t => <span key={t} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg font-bold text-xs shadow-sm">{t}</span>)}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-mono italic">Ø</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 border border-slate-200 text-center">
                            {nfa.finalStates.includes(state) ? (
                              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-extrabold text-xs shadow-sm border border-red-200">YES</span>
                            ) : (
                              <span className="text-slate-300 text-xs font-medium uppercase tracking-tighter">no</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-900 leading-relaxed shadow-sm">
                  <div className="flex gap-3">
                    <i className="fas fa-info-circle mt-1 text-blue-600 text-lg"></i>
                    <div>
                      <h4 className="font-bold mb-1">Conversion Logic Summary:</h4>
                      <p>The new NFA transition function is defined as: <strong>δ'(q, a) = ε-closure( δ(ε-closure(q), a) )</strong>.</p>
                      <p className="mt-1">A state in the NFA is final if its ε-closure in the original ε-NFA contains at least one state from the original final set.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-7xl mx-auto mt-20 pb-10 text-center text-slate-400 text-sm">
        <div className="h-px bg-slate-200 w-24 mx-auto mb-6"></div>
        <p>Interactive Educational Tool for Formal Language Theory.</p>
        <p className="mt-2 font-medium">ε-NFA ➔ NFA Step-by-Step Processor</p>
      </footer>
    </div>
  );
};

export default App;
