import { ConnectionsList } from 'components/Screens/Home/Connections/ConnectionsList/ConnectionsList';
import { AddConnectionForm } from 'components/Screens/Home/Connections/AddConnectionForm';

export const Home = () => {
  return (
    <div class="flex-1 grid grid-cols-2 h-full bg-base-300">
      <ConnectionsList />
      <AddConnectionForm />
    </div>
  );
};
