import React, { useState, useEffect, useCallback } from 'react';
import Loader from './Loader';

interface LoopIteration {
  iteration: number;
  explanation: string;      // Natural language: "In iteration 1, index is 0 and the element is 'apple', so..."
  variableState: Record<string, string>;
}

interface LoopVisualizerProps {
  triggerLine: string;
  fullCode: string;
  onClose: () => void;
}

// VS Code webview API (injected by the extension host)
declare const acquireVsCodeApi: () => {
  postMessage: (msg: unknown) => void;
};

// Try to get the vscode API singleton
let vscode: ReturnType<typeof acquireVsCodeApi> | undefined;
try {
  vscode = acquireVsCodeApi();
} catch {
  // Already acquired — module-level singleton is fine
}

const LoopVisualizer: React.FC<LoopVisualizerProps> = ({ triggerLine, fullCode, onClose }) => {
  const [iterations, setIterations] = useState<LoopIteration[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ask the extension host to run getLoopIterations for us
    vscode?.postMessage({ command: 'loopVisualize', triggerLine, fullCode });

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.command === 'loopData') {
        setIsLoading(false);
        if (Array.isArray(msg.data) && msg.data.length > 0) {
          setIterations(msg.data);
        } else {
          setError('The AI could not visualize this loop. It may be too complex or not a valid loop construct.');
        }
      }
      if (msg.command === 'loopError') {
        setIsLoading(false);
        setError(msg.message ?? 'An unknown error occurred.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [triggerLine, fullCode]);

  const goToNext = useCallback(() => setCurrentIndex(i => Math.min(i + 1, iterations.length - 1)), [iterations.length]);
  const goToPrev = useCallback(() => setCurrentIndex(i => Math.max(i - 1, 0)), []);

  const current = iterations[currentIndex];

  // Progress bar percentage
  const progress = iterations.length > 0 ? ((currentIndex + 1) / iterations.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loop-vis-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex justify-between items-center px-5 py-4 border-b border-slate-700 bg-slate-800/90">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔁</span>
            <h2 id="loop-vis-title" className="text-lg font-bold text-cyan-400 tracking-tight">
              Loop Visualizer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700"
            aria-label="Close loop visualizer"
          >
            ×
          </button>
        </header>

        {/* Progress bar */}
        {iterations.length > 0 && (
          <div className="h-1 bg-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          {isLoading && <Loader label="Simulating loop iterations..." />}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-800 rounded-lg">
              <span className="text-red-400 text-xl mt-0.5">⚠</span>
              <p className="text-red-300 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {!isLoading && !error && current && (
            <>
              {/* Iteration badge + narrative */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-cyan-500/20 text-cyan-400 text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-500/40">
                    ITERATION {current.iteration}
                  </span>
                </div>
                {/* Natural-language explanation — the star of the show */}
                <p className="text-slate-200 text-base leading-relaxed">
                  {current.explanation}
                </p>
              </div>

              {/* Variable state table */}
              {Object.keys(current.variableState).length > 0 && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3 flex items-center gap-1">
                    <span className="text-emerald-400">▶</span> Variable State
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(current.variableState).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-cyan-500/40 rounded-lg px-3 py-2 transition-colors"
                      >
                        <span className="font-mono text-emerald-400 text-sm font-medium">{key}</span>
                        <span className="font-mono text-slate-200 bg-slate-700/60 px-2 py-0.5 rounded text-sm max-w-[60%] truncate text-right">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer navigation */}
        {!isLoading && !error && iterations.length > 0 && (
          <footer className="flex justify-between items-center px-5 py-3 border-t border-slate-700 bg-slate-800/90">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              ← Prev
            </button>

            <div className="flex gap-1.5">
              {iterations.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex ? 'bg-cyan-400 scale-125' : 'bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to iteration ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              disabled={currentIndex === iterations.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
            >
              Next →
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default LoopVisualizer;
