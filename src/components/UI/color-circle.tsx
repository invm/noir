import { ConnectionColor } from "interfaces";

export const ColorCircle = (props: { color: ConnectionColor }) => {
  return (
    <div class="h-[32px] flex items-center pl-2">
      <span
        class={`min-w-[20px] w-[20px] min-h-[20px] h-[20px] rounded-full border-2 bg-${props.color}-500`}
      ></span>
    </div>
  );
};
