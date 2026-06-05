// Custom marked renderer for terminal output with gum.jsx support

import { readFileSync } from 'fs'
import { Marked } from 'marked'
import type { Tokens, RendererObject, TokenizerAndRendererExtension } from 'marked'

import { rasterizeSvg, type RasterizePngArgs } from '../render'
import { evaluateGum } from '../eval'
import { ansi, formatImage } from './term'
import type { Size, ThemeName } from './types'

const HEADING_COLORS = ['magenta', 'blue', 'green', 'red', 'cyan', 'yellow']

interface Options {
    width?: number
    height?: number
    theme?: ThemeName
    size?: Size
    font?: any
    imageId?: number
  }

interface MathToken extends Tokens.Generic {
  type: 'math'
  raw: string
  text: string
  displayMode: boolean
}

// Parse space-delimited key=value options from string
function parseOptions(str: string): Options {
  const opts: Options = {}
  for (const part of str.split(/\s+/)) {
    const eq = part.indexOf('=')
    if (eq > 0) {
      const key = part.slice(0, eq)
      const value = part.slice(eq + 1)
      if (key == 'height' || key == 'width') {
        opts[key] = Number(value)
      } else if (key == 'theme' && (value == 'light' || value == 'dark')) {
        opts.theme = value
      }
    }
  }
  return opts
}

// Check if language is gum/gum.jsx
function isGumLang(lang: string): boolean {
  return lang === 'gum' || lang === 'gum.jsx'
}

function displayMarkdown(content: string, opts: Options = {}): string {
  const marked = new Marked({
    renderer: createRenderer(opts),
    extensions: createMathExtensions(opts)
  })
  return marked.parse(content) as string
}

function displayGum(code: string, { theme = 'dark', width = 1000, height = 500, imageId }: { theme?: ThemeName, width?: number, height?: number, imageId?: number } = {}): string {
  const size: Size = [width, height]
  const elem = evaluateGum(code, { theme, size })
  const svg = elem.svg()
  const png = rasterizeSvg(svg)
  return formatImage(png, { imageId }) + '\n'
}

function renderMath(tex: string, displayMode: boolean, globalOpts: Options): string {
  const fallback = displayMode ? `$$\n${tex}\n$$` : `$${tex}$`
  const code = `<Latex${displayMode ? '' : ' inline'}>{${JSON.stringify(tex)}}</Latex>`
  const opts = {
    ...globalOpts,
    height: globalOpts.height ?? (displayMode ? 75 : 40),
    width: globalOpts.width ?? (displayMode ? 750 : 600)
  }

  try {
    return displayGum(code, opts).trimEnd()
  } catch {
    return ansi(fallback, { fg: 'gray' })
  }
}

// Create Marked extensions for TeX math delimiters.
export function createMathExtensions(globalOpts: Options = {}): TokenizerAndRendererExtension[] {
  return [
    {
      name: 'math',
      level: 'block',
      start(src: string): number | void {
        return src.match(/^ {0,3}\$\$/m)?.index
      },
      tokenizer(src: string): MathToken | undefined {
        const dollarMatch = src.match(/^ {0,3}\$\$[ \t]*(?:\n([\s\S]+?)\n {0,3}\$\$[ \t]*|\s*([^\n]+?)\s*\$\$[ \t]*)(?:\n+|$)/)
        if (dollarMatch) {
          return {
            type: 'math',
            raw: dollarMatch[0],
            text: (dollarMatch[1] ?? dollarMatch[2]).trim(),
            displayMode: true
          }
        }
      },
      renderer(token: Tokens.Generic): string {
        const math = token as MathToken
        return renderMath(math.text, true, globalOpts) + '\n\n'
      }
    },
    {
      name: 'math',
      level: 'inline',
      start(src: string): number | void {
        return src.indexOf('$')
      },
      tokenizer(src: string): MathToken | undefined {
        const dollarMatch = src.match(/^\$(?![\s$])((?:\\.|[^\n\\$])+?)(?<!\s)\$(?!\$)/)
        if (dollarMatch) {
          return {
            type: 'math',
            raw: dollarMatch[0],
            text: dollarMatch[1],
            displayMode: false
          }
        }
      },
      renderer(token: Tokens.Generic): string {
        const math = token as MathToken
        const body = renderMath(math.text, math.displayMode, globalOpts)
        const foot = math.displayMode ? '\n\n' : ''
        return body + foot
      }
    }
  ]
}

// Create renderer with given global options
export function createRenderer(globalOpts: Options = {}): RendererObject {
  return {
    // Block elements
    heading({ tokens, depth }: Tokens.Heading): string {
      const text = this.parser.parseInline(tokens)
      const prefix = '#'.repeat(depth)
      const clr = HEADING_COLORS[depth - 1] || 'magenta'
      return ansi(`${prefix} ${text}`, { fg: clr, bold: true }) + '\n\n'
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      const text = this.parser.parseInline(tokens)
      return `${text}\n\n`
    },

    code({ text, lang }: Tokens.Code): string {
      const [baseLang, ...rest] = (lang || '').split(/\s+/)
      const localOpts = parseOptions(rest.join(' '))
      const opts = { ...globalOpts, ...localOpts }

      if (isGumLang(baseLang)) {
        try {
          return displayGum(text, opts)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return `[gum.jsx error: ${message}]\n\n`
        }
      }

      return `\`\`\`${ansi(baseLang, { fg: 'blue' })}\n${ansi(text, { fg: 'gray' })}\n\`\`\`\n\n`
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      const text = this.parser.parse(tokens).trim().replace(/\n/g, '\n > ')
      return ` > ${text}\n\n`
    },

    list({ items, ordered }: Tokens.List): string {
      return items.map((item: Tokens.ListItem, i: number) => {
        const bullet = ordered ? ` ${i + 1}. ` : ' — '
        const text = this.parser.parse(item.tokens).trim()
        return bullet + text
      }).join('\n') + '\n\n'
    },

    hr(): string {
      return '---\n\n'
    },

    // Inline elements
    strong({ tokens }: Tokens.Strong): string {
      const text = this.parser.parseInline(tokens)
      return ansi(`**${text}**`, { bold: true })
    },

    em({ tokens }: Tokens.Em): string {
      const text = this.parser.parseInline(tokens)
      return ansi(`_${text}_`, { fg: 'gray', italic: true, bold: true })
    },

    codespan({ text }: Tokens.Codespan): string {
      return `\`${ansi(text, { fg: 'blue' })}\``
    },

    link({ href, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens)
      return `[${ansi(text, { fg: 'blue' })}](${ansi(href, { fg: 'gray' })}`
    },

    image({ href, text }: Tokens.Image): string {
      const isUrl = /^https?:\/\//.test(href)
      const ext = href.split('.').pop()?.toLowerCase()

      if (isUrl) return ansi(`[External URL: ${href}]`, { fg: 'gray' })

      try {
        if (ext === 'png') {
          const png = readFileSync(href)
          return formatImage(png)
        } else if (ext == 'svg') {
          const svg = readFileSync(href, 'utf8')
          const opts = parseOptions(text ?? '')
          const png = rasterizeSvg(svg, opts as RasterizePngArgs)
          return formatImage(png)
        } else if (ext == 'jsx') {
          const data = readFileSync(href, 'utf8')
          const opts = parseOptions(text ?? '')
          return displayGum(data, opts)
        } else {
          return ansi(`[Unsupported image type: ${ext}]`, { fg: 'gray' })
        }
      } catch {
        return ansi(`[Unable to load image: ${href}]`, { fg: 'gray' })
      }
    },

    text(token: Tokens.Text | Tokens.Escape): string {
      if ('tokens' in token) {
        return this.parser.parseInline(token.tokens ?? [])
      } else {
        return token.text
      }
    },

    html(token: Tokens.HTML | Tokens.Tag): string {
      return 'text' in token ? token.text : ''
    },

    br(): string {
      return '\n'
    }
  }
}

export { displayMarkdown }
