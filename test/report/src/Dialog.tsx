import { useEffect, useRef } from "react";
import type { Example, Theme } from "./types";
import { Chips, Figure } from "./CardTile";
import { Code } from "./Code";

/**
 * The full view of one example: the render and its source side by side, with
 * the strict-mode error above the drawing when there is one. Fills the
 * viewport; the code scrolls inside its own box.
 */
export function Dialog({ example, theme, index, count, onClose, onStep }: {
  example: Example; theme: Theme; index: number; count: number; onClose: () => void; onStep: (delta: number) => void;
}) {
  // focus lands on the dialog when it opens (and when stepping to another
  // example), and the page behind it stops scrolling, so wheel and keyboard
  // scrolling go to the panels inside rather than to the grid underneath
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { panel.current?.focus(); }, [example.id]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  const box = "rounded-lg border border-gray-300 overflow-hidden dark:border-neutral-700";
  const label = "mb-1 flex-none text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-10 backdrop-blur-[2px]" onClick={onClose}>
      <div
        ref={panel} tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="flex h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-xl border border-gray-300 bg-white
                   text-gray-900 shadow-2xl dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
      >
        <div className="flex flex-none items-center gap-3 border-b border-gray-300 px-4 py-3 dark:border-neutral-700">
          <span className="font-mono text-sm">{example.path}</span>
          <span className="mr-auto"><Chips example={example} /></span>
          <span className="text-sm text-gray-500 dark:text-neutral-400">{index + 1} / {count}</span>
          <button onClick={onClose} aria-label="close"
                  className="h-7 w-7 rounded-full text-xl leading-none text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-neutral-700 dark:hover:text-white">
            ×
          </button>
        </div>

        <div key={example.id} className="grid min-h-0 flex-1 grid-cols-2 gap-4 p-4">
          <div className="flex min-h-0 flex-col">
            <h3 className={label}>render ({theme})</h3>
            <Figure example={example} theme={theme} className={`${box} flex-1`} />
          </div>
          <div className="flex min-h-0 flex-col">
            <h3 className={label}>code</h3>
            <Code code={example.code.trim()} className={box} />
          </div>
        </div>
      </div>
    </div>
  );
}
