import { useEffect, useMemo, useState } from "react";
import "./index.css";
import type { Example, Manifest, Theme } from "./types";
import { CardTile } from "./CardTile";
import { Dialog } from "./Dialog";

type Status = "" | "pass" | "fail";

// the theme picks both the page chrome and which of the two renders shows
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("gum-report-theme") as Theme) ?? "light");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("gum-report-theme", theme);
  }, [theme]);
  return [theme, () => setTheme(t => (t === "dark" ? "light" : "dark"))] as const;
}

export function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState<Status>("");
  // the open example lives in the URL hash, so a card can be linked to and reloaded
  const [active, setActive] = useState<string | null>(() => decodeURIComponent(location.hash.slice(1)) || null);
  useEffect(() => {
    const base = location.href.split("#")[0]!;
    history.replaceState(null, "", active ? `${base}#${encodeURIComponent(active)}` : base);
  }, [active]);
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    fetch("/manifest.json")
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? r.statusText);
        setManifest(data as Manifest);
      })
      .catch(e => setError(String(e)));
  }, []);

  // the examples that survive the filters, in page order; the dialog steps through these
  const visible = useMemo(() => {
    if (!manifest) return [];
    const needle = query.trim().toLowerCase();
    return manifest.examples.filter(e =>
      (!group || e.group === group) &&
      (!status || e.status === status) &&
      (!needle || [e.id, e.code, e.renders.light.error, e.renders.dark.error].join(" ").toLowerCase().includes(needle)),
    );
  }, [manifest, query, group, status]);

  const activeIndex = visible.findIndex(e => e.id === active);
  const step = (delta: number) => {
    if (activeIndex < 0 || visible.length === 0) return;
    setActive(visible[(activeIndex + delta + visible.length) % visible.length]!.id);
  };

  if (error) return <p className="p-8 font-mono text-red-600">{error}</p>;
  if (!manifest) return <p className="p-8 text-gray-500">loading…</p>;

  const control = "rounded-md border border-gray-300 bg-white px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800";
  const counts = (items: Example[]) => {
    const failed = items.filter(e => e.status === "fail").length;
    return failed > 0 ? `${items.length} · ${failed} failing` : `${items.length}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 px-8 py-6 text-gray-900 dark:bg-neutral-900 dark:text-neutral-200">
      <header className="mb-4 flex flex-wrap items-center gap-4">
        <h1 className="mr-auto text-xl font-semibold">gum.jsx test report</h1>
        <input
          type="search" value={query} onChange={e => setQuery(e.target.value)} size={32}
          placeholder="filter by name, code, error…" className={control}
        />
        <select value={group} onChange={e => setGroup(e.target.value)} className={control}>
          <option value="">all groups</option>
          {manifest.groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value as Status)} className={control}>
          <option value="">all results</option>
          <option value="fail">failing</option>
          <option value="pass">passing</option>
        </select>
        <button onClick={toggleTheme} className={`${control} rounded-full`}>
          {theme === "dark" ? "light" : "dark"}
        </button>
        <div className="w-full text-sm text-gray-500 dark:text-neutral-400">
          <span className="text-green-600 dark:text-green-400">{manifest.passed} passed</span>
          {", "}
          <span className={manifest.failed > 0 ? "text-red-600 dark:text-red-400" : ""}>{manifest.failed} failed</span>
          {" · generated "}{manifest.generated.replace("T", " ").slice(0, 19)}
          {" · click a card; ← → to step through"}
        </div>
      </header>

      {manifest.groups.map(g => {
        const members = visible.filter(e => e.group === g);
        if (members.length === 0) return null;
        return (
          <section key={g}>
            <h2 className="mt-8 mb-3 border-b border-gray-300 pb-1 font-mono text-base font-semibold dark:border-neutral-700">
              {g} <span className="ml-2 font-normal text-gray-500 dark:text-neutral-400">{counts(members)}</span>
            </h2>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
              {members.map(e => <CardTile key={e.id} example={e} theme={theme} onOpen={() => setActive(e.id)} />)}
            </div>
          </section>
        );
      })}

      {activeIndex >= 0 && (
        <Dialog
          example={visible[activeIndex]!} theme={theme} index={activeIndex} count={visible.length}
          onClose={() => setActive(null)} onStep={step}
        />
      )}
    </div>
  );
}

export default App;
