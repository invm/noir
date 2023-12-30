import { AlertTypes } from 'components/UI';
import { createStore } from 'solid-js/store';
import { randomId } from 'utils/utils';

type Error = {
  message: string;
  id: string;
  type: AlertTypes;
};

export const MessageService = () => {
  const errorStore = createStore<Error[]>([]);
  const [messages, setMessages] = errorStore;

  const notify = (message: string | unknown, type: AlertTypes = 'error') => {
    console.log(message);
    const id = randomId();
    setMessages(messages.concat({ message: String(message), id, type }));

    setTimeout(() => {
      setMessages(messages.filter((e) => e.id !== id));
    }, 5000);
  };

  return { messages, notify };
};
