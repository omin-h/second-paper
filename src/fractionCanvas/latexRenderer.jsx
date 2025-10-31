import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const LatexPreview = React.forwardRef(({ latex }, ref) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        katex.render(latex, containerRef.current, {
          throwOnError: false,
          displayMode: false
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
      }
    }
  }, [latex]);

  return (
    <span
      ref={(el) => {
        containerRef.current = el;
        if (ref) {
          if (typeof ref === 'function') ref(el);
          else ref.current = el;
        }
      }}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        margin: '0 6px'
      }}
    />
  );
});

export const parseLatexFromText = (text) => {
  // If user wraps LaTeX with ** ... **, split by those markers
  const explicitPattern = /\*\*([^*]+)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  // First, handle explicit ** ... ** regions
  while ((match = explicitPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }
    parts.push({
      type: 'latex',
      content: match[1].trim()
    });
    lastIndex = explicitPattern.lastIndex;
  }

  // Add any remaining text after last **
  if (lastIndex < text.length) {
    text = text.slice(lastIndex);
    // Now, split remaining text by LaTeX commands
    const latexPattern = /\\[a-zA-Z]+(?:\{[^}]*\}|\([^)]*\))*|\\[^a-zA-Z\s]/g;
    let lastLatexIndex = 0;
    let latexMatch;
    while ((latexMatch = latexPattern.exec(text)) !== null) {
      if (latexMatch.index > lastLatexIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastLatexIndex, latexMatch.index)
        });
      }
      parts.push({
        type: 'latex',
        content: latexMatch[0]
      });
      lastLatexIndex = latexPattern.lastIndex;
    }
    if (lastLatexIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastLatexIndex)
      });
    }
  }

  return parts;
};