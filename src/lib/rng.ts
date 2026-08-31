// random number generator

import { defaultEnv } from './default'

//
// rng class
//

class RNG {
    state: number
    spareNormal: number | null

    constructor(seed: number = 42) {
        this.state = 0
        this.spareNormal = null
        this.setSeed(seed)
    }

    setSeed(seed: number): this {
        this.state = seed
        this.spareNormal = null
        return this
    }

    random(): number {
        this.state = (this.state + 0x6D2B79F5) >>> 0
        let t = this.state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    uniform(lo: number = 0, hi: number = 1): number {
        if (hi <= lo) throw new Error('Uniform upper bound must be greater than lower bound')
        return lo + (hi - lo) * this.random()
    }

    normal(mean: number = 0, stdv: number = 1): number {
        if (stdv <= 0) throw new Error('Normal standard deviation must be positive')

        if (this.spareNormal != null) {
            const value = this.spareNormal
            this.spareNormal = null
            return mean + stdv * value
        }

        let u = 0
        let v = 0
        let s = 0
        while (s == 0 || s >= 1) {
            u = this.uniform(-1, 1)
            v = this.uniform(-1, 1)
            s = u*u + v*v
        }

        const scale = Math.sqrt(-2 * Math.log(s) / s)
        this.spareNormal = v * scale
        return mean + stdv * u * scale
    }

    integer(lo: number, hi?: number): number {
        const [ start, end ] = hi == null ? [ 0, lo ] : [ lo, hi ]
        if (start % 1 != 0 || end % 1 != 0) throw new Error('Integer bounds must be integers')
        if (end <= start) throw new Error('Integer upper bound must be greater than lower bound')
        return start + Math.floor(this.random() * (end - start + 1))
    }
}

//
// default instances
//

// the seed every evaluation starts from unless it asks for another
const DEFAULT_SEED = 42

// `random`/`uniform`/`normal`/`integer` here draw from the default Env's user
// stream (src/lib/default.ts), for host code that imports them directly;
// evaluated code gets the same functions bound to the Env it runs in (see
// Env.scope in src/env.ts). Every Env keeps two streams: `rng` backs these,
// `uids` backs gum's own internal draws (element ids for clip/mask), so that
// adding a clipped element to a figure does not shift the "random" data the
// figure draws elsewhere.

function setSeed(seed: number): void {
    defaultEnv().rng.setSeed(seed)
}

function random(): number {
    return defaultEnv().rng.random()
}

function uniform(lo: number = 0, hi: number = 1): number {
    return defaultEnv().rng.uniform(lo, hi)
}

function normal(mean: number = 0, stdv: number = 1): number {
    return defaultEnv().rng.normal(mean, stdv)
}

function integer(lo: number, hi?: number): number {
    return defaultEnv().rng.integer(lo, hi)
}

//
// exports
//

export { RNG, DEFAULT_SEED, setSeed, random, uniform, normal, integer }
