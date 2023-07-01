import { ConnectionColor } from "../../interfaces"

export const ColorCircle = (props: { color: ConnectionColor }) => {
  return <span class={`min-w-[20px] w-[20px] min-h-[20px] h-[20px] mb-1 rounded-full border-2 bg-${props.color}-500`}></span>
}
