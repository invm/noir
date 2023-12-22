import { JSX } from 'solid-js/jsx-runtime';

export const AlertColors = {
  info: 'text-info-content bg-info',
  success: 'text-success-content bg-success',
  warning: 'text-warning-content bg-warning',
  error: 'text-error-content bg-error',
};

export type AlertTypes = keyof typeof AlertColors;

const Alert = (props: { children: JSX.Element; color: AlertTypes }) => {
  return (
    <div
      class={`flex px-2 py-1 items-center text-sm rounded-lg ${AlertColors[props.color]
        }`}
      role="alert"
    >
      <svg
        aria-hidden="true"
        class="flex-shrink-0 inline w-5 h-5 mr-3"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        ></path>
      </svg>
      <span class="sr-only">{props.color}</span>
      <div>{props.children}</div>
    </div>
  );
};

export { Alert };
