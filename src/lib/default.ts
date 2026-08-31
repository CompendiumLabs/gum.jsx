// the default Env
//
// Every element is constructed against an Env (src/env.ts), which carries the
// theme, strict flag, random streams and font registry it reads while it is
// built. Elements made in evaluated JSX get the evaluating Env; host code that
// constructs elements directly (`new Circle()`) without passing `env` gets the
// default one, held here.
//
// This module is a leaf: the elements import it for the fallback and src/env.ts
// imports the elements, so the default is created lazily through a factory that
// env.ts installs when it loads.

import type { Env } from '../env'

let DEFAULT: Env | null = null
let factory: (() => Env) | null = null

// installed by src/env.ts
function setDefaultEnvFactory(make: () => Env): void {
    factory = make
}

// the default Env, created on first use
function defaultEnv(): Env {
    if (DEFAULT == null) {
        if (factory == null) throw new Error('No default Env: import @gum-jsx/core before constructing elements')
        DEFAULT = factory()
    }
    return DEFAULT
}

// replace the default Env (for a host that wants, say, a dark default)
function setDefaultEnv(env: Env): void {
    DEFAULT = env
}

// the Env an element should use: the one it was given, else the default
function resolveEnv(env?: Env): Env {
    return env ?? defaultEnv()
}

export { defaultEnv, setDefaultEnv, setDefaultEnvFactory, resolveEnv }
