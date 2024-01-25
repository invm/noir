type LabelProps = {
  label: string;
  for: string;
};
export const Label = (props: LabelProps) => {
  return (
    <label for={props.for} class="block text-sm font-medium">
      {props.label}
    </label>
  );
};
