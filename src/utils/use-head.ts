import { useLocation } from '@solidjs/router';

export const useHead = () => {
  const location = useLocation();
  const parts = location.pathname.split('/');
  const head = () => parts[parts.length - 1];
  return head;
};
