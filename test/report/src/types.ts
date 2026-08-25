// mirrors the manifest `bun scripts/test.ts --report` writes to test/data

export type Theme = "light" | "dark";

export interface Render {
  svg: string | null;   // path relative to the data dir, null if it did not render
  error: string | null; // the strict-mode failure, if any
}

export interface Example {
  id: string;           // <group>/<name>
  name: string;
  group: string;        // docs | gala | test
  path: string;         // the source .jsx, relative to the repo root
  code: string;
  status: "pass" | "fail";
  renders: Record<Theme, Render>;
}

export interface Manifest {
  generated: string;
  themes: Theme[];
  groups: string[];
  passed: number;
  failed: number;
  examples: Example[];
}
