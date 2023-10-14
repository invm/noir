import { JSX } from "solid-js/jsx-runtime";

const Label = (props: { for: string; value?: string; children?: JSX.Element }) => {
  return (
    <label for={props.for} class="text-sm font-medium">
      {props.children ?? props.value}
    </label>
  );
};

export { Label };
