import React from 'react';

const Loader: React.FC<{ label?: string }> = ({ label = 'Analyzing...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm animate-pulse">{label}</p>
    </div>
  );
};

export default Loader;
