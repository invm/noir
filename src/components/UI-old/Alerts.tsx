import { For, Show } from 'solid-js';
import { useAppSelector } from '../../services/Context';
import { Alert } from './Alert';

export const Alerts = () => {
  const {
    messages: { messages },
  } = useAppSelector();
  return (
    <Show when={messages.length > 0}>
      <div class="absolute">
        <div class="toast whitespace-normal min-w-[300px] max-w-[600px] z-50">
          <For each={messages}>
            {(msg) => (
              <Alert color={msg.type}>
                <span class="font-medium">{msg.message}</span>
              </Alert>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};
