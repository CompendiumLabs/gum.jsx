// GUM.JSX

import { useRef, useState, useEffect } from 'react'
import { evaluateGum } from './Eval'
import { CodeEditor } from './Editor'

import './App.css'
import './fonts.css'

//
// app
//

const DEFAULT_CODE = `<Svg>
  <Frame padding={0.1} margin={0.1} border={1} border-radius={5}>
    <HStack>
      <VStack size={1/3}>
        <Frame padding={0.1} border={1} border-radius={3} border-fill="#aaa4">
          <Text>Hello!</Text>
        </Frame>
        <Circle fill={red} />
      </VStack>
      <Ellipse fill={blue} />
    </HStack>
  </Frame>
</Svg>
`

export default function App() {
  const outerRef = useRef(null)
  const editorRef = useRef(null)
  const canvasRef = useRef(null)
  const [ key, setKey ] = useState(0)

  const [ code, setCode ] = useState(DEFAULT_CODE)
  const [ element, setElement ] = useState(null)
  const [ error, setError ] = useState(null)
  const [ zoom, setZoom ] = useState(70)

  // update code and render
  function handleCode(code) {
    setCode(code)
    setKey(key + 1)
  }

  // handle scroll zoom
  function handleZoom(event) {
    const { target, deltaY } = event
    if (target != canvasRef.current) return
    const factor = deltaY < 0 ? 1.2 : 0.8
    const newZoom = Math.max(10, Math.min(100, zoom * factor))
    console.log('handleZoom', newZoom)
    setZoom(newZoom)
  }

  // eval code for element render
  useEffect(() => {
    const [ newElement, newError ] = evaluateGum(code)
    if (newElement) setElement(newElement)
    setError(newError)
  }, [ code ])

  // set width directly using style
  const style = {
    width: `${zoom}%`,
    height: `${zoom}%`,
  }

  // render full screen
  return <div ref={outerRef} className="w-screen h-screen p-5 bg-gray-100" onWheel={handleZoom}>
    <div className="w-full h-full flex flex-col gap-5">
      <div className="w-full h-[30%] flex flex-row gap-5">
        <div className="w-[55%] h-full flex border rounded-md border-gray-500">
          <CodeEditor editorRef={editorRef} className="h-full" code={code} setCode={handleCode} />
        </div>
        <div className="w-[45%] h-full flex border rounded-md border-gray-500 bg-white">
          <div className="w-full h-full flex flex-col">
            <div className="w-full border-b border-gray-500 p-2 font-mono smallcaps">
              Status — {error ? <span className="text-red-500">Error</span> : "Success"}
            </div>
            <div className="w-full p-2">
              {error && <div className="whitespace-pre-wrap font-mono text-sm">{error}</div>}
            </div>
          </div>
        </div>
      </div>
      <div ref={canvasRef} className="w-full h-[70%]">
        <div className="relative w-full h-full flex border rounded-md border-gray-500 bg-white pointer-events-none select-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={style}>
            {element}
          </div>
        </div>
      </div>
    </div>
  </div>
}
