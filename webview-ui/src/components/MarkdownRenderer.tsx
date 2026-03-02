import React from 'react';

// Renders fenced code blocks, headings, bold and inline code in AI explanations.
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = content.split(codeBlockRegex);

  return (
    <div className="text-slate-300 leading-relaxed space-y-1">
      {parts.map((part, index) => {
        if (index % 3 === 0) {
          return <InlineMarkdown key={index} text={part} />;
        } else if (index % 3 === 1) {
          const lang = part;
          const code = parts[index + 1];
          return (
            <pre key={index} className="bg-slate-950 border border-slate-700 rounded-lg p-4 my-3 overflow-x-auto text-sm">
              <code className={`language-${lang} text-emerald-300`}>{code}</code>
            </pre>
          );
        }
        return null;
      })}
    </div>
  );
};

const InlineMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, lineIdx) => {
        // Headings
        if (line.startsWith('### ')) {
          return (
            <h3 key={lineIdx} className="text-base font-semibold text-slate-200 mt-4 mb-1 border-b border-slate-700 pb-1">
              {line.substring(4)}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={lineIdx} className="text-lg font-bold text-slate-100 mt-5 mb-2 border-b border-slate-600 pb-1">
              {line.substring(3)}
            </h2>
          );
        }

        // Regular line with inline tokens
        const inlineRegex = /(\*\*.*?\*\*|`.*?`)/g;
        const segments = line.split(inlineRegex);
        return (
          <p key={lineIdx} className="mb-1">
            {segments.map((seg, i) => {
              if (seg.startsWith('**') && seg.endsWith('**')) {
                return <strong key={i} className="text-cyan-400 font-semibold">{seg.slice(2, -2)}</strong>;
              }
              if (seg.startsWith('`') && seg.endsWith('`')) {
                return (
                  <code key={i} className="bg-slate-700 text-emerald-300 rounded px-1.5 py-0.5 text-xs font-mono">
                    {seg.slice(1, -1)}
                  </code>
                );
              }
              return <span key={i}>{seg}</span>;
            })}
          </p>
        );
      })}
    </>
  );
};

export default MarkdownRenderer;
