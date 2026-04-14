// data table tools

import * as Papa from 'papaparse'
import type { ParseConfig } from 'papaparse'

type TableRow = Record<string, unknown>

function parseTable(text: string, args: ParseConfig<TableRow> = {}): TableRow[] {
    const result = Papa.parse<TableRow>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      ...args
    })

    if (result.errors.length > 0) {
      const [ error ] = result.errors
      const row = error.row != null ? ` at row ${error.row}` : ''
      throw new Error(`Failed to parse table: ${error.message}${row}`)
    }

    return result.data
  }

export { parseTable }
