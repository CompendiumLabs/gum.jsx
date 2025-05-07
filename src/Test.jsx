import Gum from './gum.jsx'
import { Children, cloneElement } from 'react'

const { Svg, Frame, Text } = Gum
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

function MappedTest() {
  return <div className="w-[500px] h-[500px] border-2 m-5 p-5">
    <Parent>
      <Child text="Hello" aspect={1} />
      <Child text="World" aspect={2} />
      <Child text="Testing" aspect={3} />
    </Parent>
  </div>
}

function SvgTest() {
  return <div className="border-2 m-5 p-5">
    <Svg>
      <Frame>
        <Text>Hello</Text>
      </Frame>
    </Svg>
  </div>
}

export default function Test() {
  return <div className="flex flex-col gap-5">
    <SvgTest />
  </div>
}
