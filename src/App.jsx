import './App.css'

import * as Babel from '@babel/standalone'
import React, { useRef, useState, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import ErrorBoundary from './Error'

import Gum from './gum'
import * as Utils from './utils'

import './fonts.css'

//
// babel
//

// import utility functions
const UTIL_KEYS = [
  'red', 'green', 'blue', 'range', 'linspace',
]
const UTIL_VALS = UTIL_KEYS.map(key => Utils[key])

// import gum components
const GUM_KEYS = [
  'Group', 'Svg', 'Frame', 'Stack', 'HStack', 'VStack', 'Rect', 'Square', 'Ellipse',
  'Circle', 'Line', 'Polyline', 'Polygon', 'Text', 'Symline', 'Sympoly', 'Graph',
]
const GUM_VALS = GUM_KEYS.map(key => Gum[key])

// combine keys and values
const KEYS = [...UTIL_KEYS, ...GUM_KEYS]
const VALS = [...UTIL_VALS, ...GUM_VALS]

function DynamicJSX({ code }) {
  const [element, setElement] = useState(null)
  const [error, setError] = useState(null)

  // memoize the element
  useEffect(() => {
    try {
      // reset the error
      setError(null)

      // transform JSX to JavaScript
      const presets = ['react']
      const { code: transformedCode } = Babel.transform(code, { presets })

      // get inputs
      const functionBody = `return ${transformedCode}`

      // create a function that returns the React element
      const executeFunction = new Function('React', ...KEYS, functionBody)
      const element = executeFunction(React, ...VALS)

      // set the element
      setElement(element)
    } catch (error) {
      setError(error.message)
    }
  }, [code])

  // error short circuit
  if (error) {
    return <div className="text-red-500 whitespace-pre-wrap font-mono">{error}</div>
  }

  // return the element
  return element ?? null
}

//
// codemirror
//

const extensions = [javascript({jsx: true})]

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
  const editorRef = useRef(null)
  const [key, setKey] = useState(0)
  const [code, setCode] = useState(DEFAULT_CODE)

  function handleCode(code) {
    setCode(code)
    setKey(key + 1)
  }

  return <div className="w-screen h-screen flex flex-row">
    <div className="w-1/2 h-full">
      <div className="flex w-full h-full">
        <CodeEditor editorRef={editorRef} code={code} setCode={handleCode} />
      </div>
    </div>
    <div className="w-1/2 h-full p-2 border-l border-gray-300">
      <div className="w-full h-full">
        <ErrorBoundary key={key}>
          <DynamicJSX code={code} />
        </ErrorBoundary>
      </div>
    </div>
  </div>
}
