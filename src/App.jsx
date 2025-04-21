import './App.css'

import * as Babel from '@babel/standalone'
import React, { useRef, useState, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import ErrorBoundary from './Error'
import Gum from './gum'

//
// babel
//

function DynamicJSX({ code }) {
  const [element, setElement] = useState(null)
  const [error, setError] = useState(null)

  // memoize the element
  useEffect(() => {
    try {
      // reset the error
      setError(null)

      // wrap the code in a function
      const wrap = `function render() {\n${code}\n}`
      console.log(wrap)

      // transform JSX to JavaScript
      const transformedCode = Babel.transform(wrap, {
        presets: ['react']
      }).code

      console.log(transformedCode)

      // get inputs
      const keys = Object.keys(Gum)
      const vals = Object.values(Gum)
      const functionBody = `return ${transformedCode}`

      // create a function that returns the React element
      const executeFunction = new Function('React', ...keys, functionBody)
      const element = executeFunction(React, ...vals)

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

const DEFAULT_CODE = `
return <Svg>
  <Frame padding={0.1} margin={0.1} border={1}>
    <HStack>
      <VStack size={1/3}>
        <Circle />
        <Circle stroke="red" />
      </VStack>
      <Ellipse stroke="blue" />
    </HStack>
  </Frame>
</Svg>
`.trim()

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
