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
    }

    export type TreeText = {
        type: 'text'
        body: TreeNode[]
    }

    export type TreeSupSub = {
        type: 'supsub'
        base: TreeNode
        sup: TreeNode
        sub: TreeNode
    }

    export type TreeGenFrac = {
        type: 'genfrac'
        numer: TreeNode
        denom: TreeNode
    }

    export type TreeNode =
        | TreeAtom
        | TreeTextOrd
        | TreeMathOrd
        | TreeOrdGroup
        | TreeOp
        | TreeText
        | TreeSupSub
        | TreeGenFrac

    export type Tree = TreeNode[]

    export function __parse(tex: string, options?: any): Tree
}
