import { useEffect, useState } from "react";
import type { Example, Theme } from "./types";

// the svg files are fetched and inlined rather than dropped in an <img>, so
// they draw with the page's @font-face rules (see fonts.css); one request per
// file, cached across theme flips and dialog opens
const cache = new Map<string, Promise<string>>();

function fetchSvg(path: string): Promise<string> {
  let pending = cache.get(path);
  if (!pending) {
    pending = fetch(`data/${path}`).then(r => {
      if (!r.ok) throw new Error(`${path}: ${r.statusText}`);
      return r.text();
    });
    cache.set(path, pending);
  }
  return pending;
}

export function useSvg(path: string | null): string | null {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    setSvg(null);
    if (path == null) return;
    let live = true;
    fetchSvg(path).then(t => { if (live) setSvg(t); }).catch(() => {});
    return () => { live = false; };
  }, [path]);
  return svg;
}

export function Chips({ example }: { example: Example }) {
  const chip = "rounded-full px-2 py-0.5 text-xs whitespace-nowrap";
  const status = example.status === "pass"
    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
    : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400";
  return (
    <span className="flex flex-wrap justify-end gap-1">
      <span className={`${chip} bg-gray-200 font-semibold dark:bg-neutral-700`}>{example.group}</span>
      <span className={`${chip} font-semibold ${status}`}>{example.status.toUpperCase()}</span>
    </span>
  );
}

/** An inlined gum SVG, fitted to its box (the viewBox keeps the aspect). */
export function Svg({ svg, className = "" }: { svg: string; className?: string }) {
  return <div className={`svg h-full w-full ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/**
 * One example rendered in one theme. A strict failure that still drew
 * something shows the drawing under the reason it failed; one that drew
 * nothing shows just the reason.
 */
export function Figure({ example, theme, className = "" }: { example: Example; theme: Theme; className?: string }) {
  const { svg: path, error } = example.renders[theme];
  const svg = useSvg(path);
  const background = theme === "dark" ? "bg-neutral-900" : "bg-white";
  return (
    <div className={`flex min-h-0 flex-col overflow-hidden ${background} ${className}`}>
      {error && (
        <div className="max-h-24 flex-none overflow-auto bg-red-100 px-3 py-2 font-mono text-xs whitespace-pre-wrap
                        text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {path && (
        <div className="flex min-h-0 flex-1 items-center justify-center p-3">
          {svg ? <Svg svg={svg} /> : null}
        </div>
      )}
    </div>
  );
}

/** A square card showing just the render; everything else is in the dialog. */
export function CardTile({ example, theme, onOpen }: { example: Example; theme: Theme; onOpen: () => void }) {
  const border = example.status === "pass"
    ? "border-gray-300 dark:border-neutral-700"
    : "border-red-400 dark:border-red-800";
  return (
    <article
      tabIndex={0} onClick={onOpen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className={`flex aspect-square cursor-pointer flex-col overflow-hidden rounded-lg border bg-white
                  hover:border-gray-500 dark:bg-neutral-800 ${border}`}
    >
      <div className="flex flex-none items-center justify-between gap-2 border-b border-inherit px-3 py-2">
        <span className="truncate font-mono text-sm">{example.name}</span>
        <Chips example={example} />
      </div>
      <Figure example={example} theme={theme} className="flex-1" />
    </article>
  );
}
