import Gum from './gum.jsx'
import { Children, cloneElement, useEffect, useLayoutEffect, useRef, useState } from 'react'

const { Svg, Frame, Text, Rect, red, blue } = Gum
const { MappedValuesProvider, useMappedValues, useMappedValueContext } = Gum

function Parent({ children }) {
  const [wrapped, ratios, setRatios] = useMappedValues(children)
  return <div className="flex flex-col gap-5">
    <MappedValuesProvider setValues={setRatios}>
      { Children.map(wrapped, child => {
        const { aspect } = child.props
        return cloneElement(child, { aspect2: 2 * aspect })
      })}
    </MappedValuesProvider>
  </div>
}

function Child({ id, text, aspect, aspect2 }) {
  useMappedValueContext(id, aspect)
  return <div className="flex flex-row gap-2 border-1 border-gray-300 rounded-md">
    <div className="w-25 border-r border-gray-300 bg-gray-100 p-2 rounded-l-md">{String(id)}</div>
    <div className="w-10 border-r border-gray-300 p-2">{aspect}</div>
    <div className="w-10 border-r border-gray-300 p-2">{aspect2}</div>
    <div className="p-2 rounded-r-md">{text}</div>
  </div>
}

export default function Test() {
  const svgRef = useRef()
  const [size, setSize] = useState(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const rect = entry.contentRect
        setSize([rect.width, rect.height])
      }
    })

    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  const [w, h] = size ?? []
  const style = size ? { width: `${w}px`, height: `${h}px` } : undefined
  const className = size ? 'border-2 m-5' : ''

  return <div className={className} style={style}>
    <Svg ref={svgRef}>
      <Frame border={1} margin={0.1} padding={0.05}>
        <Text>Hello</Text>
      </Frame>
    </Svg>
  </div>
}
