declare module 'katex' {
    export type SymbolMode = 'math' | 'text'
    export type SymbolFont = 'main' | 'ams'
    export type SymbolFamily = 'accent-token' | 'bin' | 'close' | 'inner' | 'mathord' | 'op-token' | 'open' | 'punct' | 'rel' | 'spacing' | 'textord'

    export type SymbolEntry = {
        font: SymbolFont
        family: SymbolFamily
        replace: string | null
    }

    export type TreeAtom = {
        type: 'atom'
        mode: SymbolMode
        family: SymbolFamily | null
        text: string
    }

    export type TreeTextOrd = {
        type: 'textord'
        mode: SymbolMode
        text: string
    }

    export type TreeMathOrd = {
        type: 'mathord'
        mode: SymbolMode
        text: string
    }

    export type TreeOrdGroup = {
        type: 'ordgroup'
        body: TreeNode[]
    }

    export type TreeOp = {
        type: 'op'
        mode: SymbolMode
        name: string
        symbol?: boolean
        limits?: boolean
        parentIsSupSub?: boolean
    }

    export type TreeKern = {
        type: 'kern'
        mode: SymbolMode
        dimension: Measurement
    }

    export type TreeText = {
        type: 'text'
        body: TreeNode[]
    }

    export type TreeSupSub = {
        type: 'supsub'
        base: TreeNode | null
        sup: TreeNode | null
        sub: TreeNode | null
    }

    export type TreeStyling = {
        type: 'styling'
        style: 'display' | 'text' | 'script' | 'scriptscript'
        body: TreeNode[]
    }

    export type Measurement = {
        number: number
        unit: string
    }

    export type TreeGenFrac = {
        type: 'genfrac'
        mode: SymbolMode
        numer: TreeNode
        denom: TreeNode
        continued: boolean
        hasBarLine: boolean
        leftDelim: string | null
        rightDelim: string | null
        barSize: Measurement | null
    }

    export type TreeSqrt = {
        type: 'sqrt'
        mode: SymbolMode
        body: TreeNode
        index: TreeNode | null
    }

    export type TreeLeftRight = {
        type: 'leftright'
        mode: SymbolMode
        body: TreeNode[]
        left: string
        right: string
    }

    export type TreeNode =
        | TreeAtom
        | TreeTextOrd
        | TreeMathOrd
        | TreeOrdGroup
        | TreeOp
        | TreeKern
        | TreeText
        | TreeStyling
        | TreeSupSub
        | TreeGenFrac
        | TreeSqrt
        | TreeLeftRight

    export type Tree = TreeNode[]

    export function __parse(tex: string, options?: any): Tree
}
