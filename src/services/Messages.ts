import { AlertTypes } from 'components/UI-old';
import { createStore } from 'solid-js/store';
import { info } from 'tauri-plugin-log-api';
import { randomId } from 'utils/utils';

type Error = {
  message: string;
  id: string;
  type: AlertTypes;
};

export const MessageService = () => {
  const [messages, setMessages] = createStore<Error[]>([]);

  const notify = (message: string | unknown, type: AlertTypes = 'error') => {
    info(String(message));
    const id = randomId();
    setMessages(messages.concat({ message: String(message), id, type }));

    setTimeout(() => {
      setMessages(messages.filter((e) => e.id !== id));
    }, 5000);
  };

  return { messages, notify };
};
