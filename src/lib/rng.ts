// random number generator

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
// single instance
//

const rng = new RNG()

function setSeed(seed: number): void {
    rng.setSeed(seed)
}

function random(): number {
    return rng.random()
}

function uniform(lo: number = 0, hi: number = 1): number {
    return rng.uniform(lo, hi)
}

function normal(mean: number = 0, stdv: number = 1): number {
    return rng.normal(mean, stdv)
}

function integer(lo: number, hi?: number): number {
    return rng.integer(lo, hi)
}

//
// exports
//

export { setSeed, random, uniform, normal, integer }
