import { useEffect, useState, useCallback } from 'react';
import { Play, ArrowRight, Code } from 'lucide-react';
import MarkdownRenderer from './components/MarkdownRenderer';
import LoopVisualizer from './components/LoopVisualizer';

interface TraceStep {
  step: number;
  line: string;
  variables: Record<string, string>;
  explanation: string;
}

const LOOP_KEYWORDS = ['for', 'while', 'forEach', 'map(', 'filter(', 'reduce(', 'do {', 'do{'];

function isLoopLine(line: string): boolean {
  return LOOP_KEYWORDS.some(kw => line.includes(kw));
}

function App() {
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showLoopVisualizer, setShowLoopVisualizer] = useState(false);
  const [loopTriggerLine, setLoopTriggerLine] = useState('');
  const [fullCode, setFullCode] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.command === 'visualize' && Array.isArray(msg.data)) {
        setTrace(msg.data);
        setCurrentStepIndex(0);
        setFullCode(msg.fullCode ?? '');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const goNext = useCallback(() => setCurrentStepIndex(i => Math.min(i + 1, trace.length - 1)), [trace.length]);
  const goPrev = useCallback(() => setCurrentStepIndex(i => Math.max(i - 1, 0)), []);

  const openLoopVisualizer = useCallback((line: string) => {
    setLoopTriggerLine(line);
    setShowLoopVisualizer(true);
  }, []);

  // ── Empty / Idle state ─────────────────────────────────────────────────────
  if (trace.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 p-8 text-center gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
          <Code className="w-14 h-14 text-blue-500/60 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-semibold text-slate-300">Ready to Visualize</p>
          <p className="text-sm text-slate-500 max-w-sm">
            Highlight a code block in your editor, then right-click → <span className="text-blue-400 font-medium">Visualize Code</span>.
          </p>
        </div>
      </div>
    );
  }

  const currentStep = trace[currentStepIndex];
  const canDrillLoop = isLoopLine(currentStep.line ?? '');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-5 selection:bg-blue-500/30">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="mb-6 pb-4 border-b border-slate-800 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-400 fill-current flex-shrink-0" />
            VisualExplainer
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 ml-7">Execution Trace</p>
        </div>

        {/* Step navigation */}
        <div className="flex items-center gap-3 bg-slate-900 rounded-full py-1.5 px-4 border border-slate-800">
          <button
            disabled={currentStepIndex === 0}
            onClick={goPrev}
            className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors text-sm font-medium px-2 py-0.5"
            aria-label="Previous step"
          >
            ← Prev
          </button>
          <span className="font-mono text-sm tabular-nums">
            <span className="text-blue-400 font-bold">{currentStepIndex + 1}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-slate-400">{trace.length}</span>
          </span>
          <button
            disabled={currentStepIndex === trace.length - 1}
            onClick={goNext}
            className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors text-sm font-medium px-2 py-0.5"
            aria-label="Next step"
          >
            Next →
          </button>
        </div>
      </header>

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left column: Line + Explanation */}
        <div className="flex flex-col gap-5">

          {/* Executing line card */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 rounded-l-xl" />
            <div className="flex items-center justify-between mb-2 ml-2">
              <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                Executing Line
              </h2>
              <span className="text-xs text-slate-600 font-mono">Step {currentStep.step}</span>
            </div>
            <div className="font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-blue-300 overflow-x-auto whitespace-pre text-sm ml-2">
              {currentStep.line || <span className="opacity-40 italic">No line provided</span>}
            </div>

            {/* Loop drill-down button */}
            {canDrillLoop && (
              <button
                onClick={() => openLoopVisualizer(currentStep.line)}
                className="mt-3 ml-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40 hover:text-indigo-200 transition-all"
                title="Step through each iteration of this loop"
              >
                <span>🔁</span> Drill into Loop
              </button>
            )}
          </section>

          {/* AI Explanation */}
          <section className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4 shadow-lg flex-1">
            <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">
              AI Explanation
            </h2>
            <MarkdownRenderer content={currentStep.explanation} />
          </section>
        </div>

        {/* Right column: Variable memory state */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4 flex items-center gap-1.5">
            Memory State
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
          </h2>

          <div className="space-y-2">
            {Object.entries(currentStep.variables ?? {}).length > 0 ? (
              Object.entries(currentStep.variables).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/30 transition-colors group"
                >
                  <span className="font-mono text-emerald-400 font-medium text-sm">{key}</span>
                  <span className="font-mono text-slate-300 bg-slate-800 group-hover:bg-slate-700 px-3 py-1 rounded text-sm overflow-hidden text-ellipsis whitespace-nowrap transition-colors max-w-[55%]">
                    {value}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 italic text-center text-sm">
                No variables tracked at this step.
              </div>
            )}
          </div>

          {/* Step dots */}
          {trace.length > 1 && (
            <div className="flex gap-1.5 mt-6 flex-wrap">
              {trace.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStepIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    i === currentStepIndex
                      ? 'bg-blue-400 scale-125'
                      : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Loop Visualizer Modal ─────────────────────────────────────────────── */}
      {showLoopVisualizer && (
        <LoopVisualizer
          triggerLine={loopTriggerLine}
          fullCode={fullCode}
          onClose={() => setShowLoopVisualizer(false)}
        />
      )}
    </div>
  );
}

export default App;
