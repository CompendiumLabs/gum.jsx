import './App.css'

import { useRef, useState, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { evaluateGum } from './Eval'

import './fonts.css'

//
// codemirror
//

const extensions = [ javascript({ jsx: true }) ]

const basicSetup = {
  lineNumbers: false,
  foldGutter: false,
  indentOnInput: false,
  highlightActiveLine: true,
  highlightActiveLineGutter: false,
  autocompletion: false,
}

function CodeEditor({ editorRef, className, code, setCode }) {
  return <CodeMirror
    ref={editorRef}
    className={className}
    width="100%"
    height="100%"
    basicSetup={basicSetup}
    extensions={extensions}
    value={code}
    onChange={setCode}
  />
}

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
  const [ key, setKey ] = useState(0)

  const [ code, setCode ] = useState(DEFAULT_CODE)
  const [ element, setElement ] = useState(null)
  const [ error, setError ] = useState(null)
  const [ zoom, setZoom ] = useState(40)

  // update code and render
  function handleCode(code) {
    setCode(code)
    setKey(key + 1)
  }

  // handle scroll zoom
  function handleZoom(event) {
    const { target, deltaY } = event
    if (target != outerRef.current) return
    const factor = deltaY < 0 ? 1.2 : 0.8
    const newZoom = Math.max(10, Math.min(100, zoom * factor))
    setZoom(newZoom)
  }

  // eval code for element render
  useEffect(() => {
    const [ newElement, newError ] = evaluateGum(code)
    if (newElement) setElement(newElement)
    setError(newError)
  }, [ code ])

  // render full screen
  return <div ref={outerRef} className="w-screen h-screen p-5 bg-gray-100" onWheel={handleZoom}>
    <div className="w-full h-full flex flex-col gap-5">
      <div className="w-full h-[30%] flex flex-row gap-5">
        <div className="w-[50%] h-full flex border rounded-md border-gray-500">
          <CodeEditor editorRef={editorRef} className="h-full" code={code} setCode={handleCode} />
        </div>
        <div className="w-[50%] h-full flex border rounded-md border-gray-500 bg-white">
          <div className="w-full h-full p-5">
            {error && <div className="text-red-500 whitespace-pre-wrap font-mono">{error}</div>}
          </div>
        </div>
      </div>
      <div className="w-full h-[70%]">
        <div className="w-full h-full flex border rounded-md border-gray-500 bg-white pointer-events-none select-none">
          {element}
        </div>
      </div>
    </div>
  </div>
}
