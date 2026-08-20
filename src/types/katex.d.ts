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
        font?: string
    }

    export type TreeFont = {
        type: 'font'
        mode: SymbolMode
        font: string
        body: TreeNode
    }

    export type TreeSupSub = {
        type: 'supsub'
        base: TreeNode | null
        sup: TreeNode | null
        sub: TreeNode | null
    }

    export type TreeAccent = {
        type: 'accent'
        mode: SymbolMode
        label: string
        isStretchy: boolean
        isShifty: boolean
        base: TreeNode
    }

    export type TreeUnderline = {
        type: 'underline'
        mode: SymbolMode
        body: TreeNode
    }

    export type TreeOverline = {
        type: 'overline'
        mode: SymbolMode
        body: TreeNode
    }

    export type TreeStyling = {
        type: 'styling'
        style: 'display' | 'text' | 'script' | 'scriptscript'
        body: TreeNode[]
    }

    export type Measurement = {
        number: number
        unit: 'mu' | 'em' | 'pt' | 'ex'
    }

    export type TreeArrayAlign = {
        type: 'align'
        align: 'l' | 'c' | 'r'
        pregap?: number
        postgap?: number
    }

    export type TreeArraySeparator = {
        type: 'separator'
        separator: string
    }

    export type TreeArrayCol = TreeArrayAlign | TreeArraySeparator

    export type TreeArray = {
        type: 'array'
        mode: SymbolMode
        body: TreeNode[][]
        cols?: TreeArrayCol[]
        arraystretch: number
        rowGaps: (Measurement | null)[]
        hLinesBeforeRow: boolean[][]
        addJot?: boolean
        hskipBeforeAndAfter?: boolean
        colSeparationType?: 'align' | 'alignat' | 'gather' | 'small' | 'CD'
        leqno?: boolean
    }

    export type TreeGenFrac = {
        type: 'genfrac'
        mode: SymbolMode
        numer: TreeNode
        denom: TreeNode
        continued: boolean
        hasBarLine: boolean
        leftDelim?: string
        rightDelim?: string
        barSize?: Measurement
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

    export type TreeSpacing = {
        type: 'spacing'
        mode: SymbolMode
        text: string
    }

    export type TreeMClass = {
        type: 'mclass'
        mode: SymbolMode
        mclass: 'mord' | 'mop' | 'mbin' | 'mrel' | 'mopen' | 'mclose' | 'mpunct' | 'minner'
        body: TreeNode[]
        isCharacterBox: boolean
    }

    export type TreeLap = {
        type: 'lap'
        mode: SymbolMode
        alignment: 'llap' | 'rlap' | 'clap'
        body: TreeNode
    }

    export type TreeHtmlMathml = {
        type: 'htmlmathml'
        mode: SymbolMode
        html: TreeNode[]
        mathml: TreeNode[]
    }

    export type TreeNode =
        | TreeAtom
        | TreeSpacing
        | TreeMClass
        | TreeLap
        | TreeHtmlMathml
        | TreeTextOrd
        | TreeMathOrd
        | TreeOrdGroup
        | TreeOp
        | TreeKern
        | TreeText
        | TreeFont
        | TreeStyling
        | TreeAccent
        | TreeUnderline
        | TreeOverline
        | TreeArray
        | TreeSupSub
        | TreeGenFrac
        | TreeSqrt
        | TreeLeftRight

    export type Tree = TreeNode[]

    export function __parse(tex: string, options?: any): Tree
}
