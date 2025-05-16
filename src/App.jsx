import './App.css'

import { useRef, useState, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import ErrorBoundary from './Error'
import { DynamicJSX } from './Eval'

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
  const [ zoom, setZoom ] = useState(40)
  const [ shift, setShift ] = useState([40, 50])

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

  // hook in keyboard handler
  useEffect(() => {
    function handleKeyDown(event) {
      const { key } = event
      if (key == 'ArrowLeft') {
        setShift(([ x, y ]) => [ x + 5, y ])
      } else if (key == 'ArrowRight') {
        setShift(([ x, y ]) => [ x - 5, y ])
      } else if (key == 'ArrowUp') {
        setShift(([ x, y ]) => [ x, y + 5 ])
      } else if (key == 'ArrowDown') {
        setShift(([ x, y ]) => [ x, y - 5 ])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const editorStyle = {
    right: '20px',
    top: '20px',
    width: '30%',
    height: '40%',
  }

  const [ x, y ] = shift
  const canvasStyle = {
    top: `${y}%`,
    left: `${x}%`,
    width: `${zoom}%`,
    height: `${zoom}%`,
    transform: `translate(-50%, -50%)`,
  }

  // render full screen
  return <div ref={outerRef} className="w-screen h-screen" onWheel={handleZoom}>
    <div className="absolute pointer-events-none select-none" style={canvasStyle}>
      <ErrorBoundary key={key}>
        <DynamicJSX code={code} />
      </ErrorBoundary>
    </div>
    <div className="absolute flex border rounded-md border-gray-500 bg-white scrollbar-none" style={editorStyle}>
      <CodeEditor editorRef={editorRef} className="h-full" code={code} setCode={handleCode} />
    </div>
  </div>
}
