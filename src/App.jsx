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

function useDragResize(outerRef) {
  const [ isDragging, setIsDragging ] = useState(false)
  const [ sliderPos, setSliderPos ] = useState(50)

  // just say we're dragging
  function handleMouseDown(event) {
    setIsDragging(true)
  }

  // just say we're not dragging
  function handleMouseUp(event) {
    setIsDragging(false)
  }

  function handleMouseMove(event) {
    if (!isDragging || outerRef.current == null) return
    const { clientX } = event

    // get container rect
    const { left, width } = outerRef.current.getBoundingClientRect()
    const newSliderPos = (clientX - left) / width * 100

    // constrain to 10% from either side
    const constrainedSliderPos = Math.max(20, Math.min(80, newSliderPos))
    setSliderPos(constrainedSliderPos) // 0-100
  }

  // attach global mouse events when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return { isDragging, sliderPos, startDrag: handleMouseDown }
}

const SLIDER_WIDTH = 8

export default function App() {
  const outerRef = useRef(null)
  const editorRef = useRef(null)
  const [ key, setKey ] = useState(0)
  const [ code, setCode ] = useState(DEFAULT_CODE)
  const { isDragging, sliderPos, startDrag } = useDragResize(outerRef)

  // update code and render
  function handleCode(code) {
    setCode(code)
    setKey(key + 1)
  }

  // Calculate actual widths accounting for the divider
  const sliderWidth = `${SLIDER_WIDTH}px`
  const leftWidth = `calc(${sliderPos}% - ${SLIDER_WIDTH * (sliderPos / 100)}px)`;
  const rightWidth = `calc(${100 - sliderPos}% - ${SLIDER_WIDTH * ((100 - sliderPos) / 100)}px)`;
  console.log(sliderWidth, leftWidth, rightWidth)

  // render full screen
  return <div ref={outerRef} className="w-screen h-screen flex flex-row">
    <div className="h-full" style={{ width: leftWidth }}>
      <div className="flex w-full h-full">
        <CodeEditor editorRef={editorRef} code={code} setCode={handleCode} />
      </div>
    </div>
    <div className={`h-full border-l border-r border-gray-200 bg-gray-100 hover:cursor-col-resize ${isDragging ? 'cursor-col-resize' : ''}`} style={{ width: sliderWidth }} onMouseDown={startDrag} />
    <div className="p-4 pointer-events-none select-none" style={{ width: rightWidth }}>
      <ErrorBoundary key={key}>
        <DynamicJSX code={code} />
      </ErrorBoundary>
    </div>
  </div>
}
