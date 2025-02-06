import { useLocation } from '@solidjs/router';

export const useHead = () => {
  const location = useLocation();
  const head = () => location.pathname.split('/')[1];
  return head;
};
