import './App.css'

import { useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import ErrorBoundary from './Error'
import { DynamicJSX } from './Eval'

import './fonts.css'

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
