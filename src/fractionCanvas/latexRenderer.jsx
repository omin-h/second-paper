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
  const latexPattern = /\\[a-zA-Z]+(?:\{[^}]*\}|\([^)]*\))*|\\[^a-zA-Z\s]/g;
  
  if (!text.match(latexPattern)) {
    return [{ type: 'text', content: text }];
  }

  const trimmed = text.trim();
  if (trimmed.match(/^[i\s]*\\[a-zA-Z]/) && trimmed.match(latexPattern)) {
    const backslashCount = (trimmed.match(/\\/g) || []).length;
    if (backslashCount >= 2) {
      return [{ type: 'latex', content: trimmed }];
    }
  }

  const wrappedPattern = /\([^)]*\\[^)]*\)/g;
  const parts = [];
  let lastIndex = 0;

  const matches = [...text.matchAll(wrappedPattern)];

  matches.forEach((match) => {
    if (match.index > lastIndex) {
      parts.push({ 
        type: 'text', 
        content: text.slice(lastIndex, match.index) 
      });
    }

    const latexContent = match[0].slice(1, -1);
    parts.push({ 
      type: 'latex', 
      content: latexContent 
    });

    lastIndex = match.index + match[0].length;
  });

  if (lastIndex < text.length) {
    parts.push({ 
      type: 'text', 
      content: text.slice(lastIndex) 
    });
  }

  if (parts.length === 0 && text.match(latexPattern)) {
    return [{ type: 'latex', content: text }];
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
};