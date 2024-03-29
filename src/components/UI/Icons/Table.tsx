export const Table = (props: { color: 'success' | 'warning' | 'info' | 'error' }) => {
  const styles = {
    success: 'w-3 h-3 text-success',
    warning: 'w-3 h-3 text-warning',
    info: 'w-3 h-3 text-info',
    error: 'w-3 h-3 text-error',
  };
  const cls = styles[props.color];
  return (
    <svg
      class={cls}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="14"
      fill="none"
      viewBox="0 0 20 14">
      <path
        stroke="currentColor"
        stroke-width="2"
        d="M1 5h18M1 9h18m-9-4v8m-8 0h16a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1Z"
      />
    </svg>
  );
};
