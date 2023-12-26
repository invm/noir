const Error = (props: { err: Record<'message', string> }) => {
  return (
    <div class="flex flex-col items-center justify-center h-full w-full">
      <h2 class="text-xl font-bold"> Something went wrong </h2>
      <br />
      <span class="text-lg">{props.err.message}</span>
    </div>
  );
};

export { Error };
