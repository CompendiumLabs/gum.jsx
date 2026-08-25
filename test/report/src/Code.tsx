import { useEffect, useState } from "react";
import { createHighlighterCore, type HighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";

// shiki, fine-grained: just the jsx grammar, the two github themes and the
// JavaScript regex engine (no wasm), so the bundle carries nothing it won't use
let loading: Promise<HighlighterCore> | null = null;
function highlighter() {
  loading ??= createHighlighterCore({
    langs: [import("@shikijs/langs/jsx")],
    themes: [import("@shikijs/themes/github-light"), import("@shikijs/themes/github-dark")],
    engine: createJavaScriptRegexEngine(),
  });
  return loading;
}

/**
 * Highlighted gum.jsx. Renders the plain text first and swaps in shiki's
 * dual-theme HTML once the highlighter is ready; the page's `dark` class
 * picks which of the two palettes shows (see index.css).
 */
export function Code({ code, className = "" }: { code: string; className?: string }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setHtml(null);
    highlighter().then(h => {
      if (!live) return;
      setHtml(h.codeToHtml(code, { lang: "jsx", themes: { light: "github-light", dark: "github-dark" }, defaultColor: false }));
    });
    return () => { live = false; };
  }, [code]);

  const base = `code min-h-0 flex-1 overflow-auto bg-gray-50 p-3 font-mono text-[0.78rem] leading-snug dark:bg-neutral-900 ${className}`;
  return html
    ? <div className={base} dangerouslySetInnerHTML={{ __html: html }} />
    : <pre className={base}>{code}</pre>;
}
