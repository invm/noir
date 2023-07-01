import { AddConnectionForm } from '../components/AddConnectionForm';
import { ConnectionsList } from '../components/ConnectionsList/ConnectionsList';

const Home = () => {
  return (
    <div class="grid grid-cols-2">
      <ConnectionsList />
      <AddConnectionForm />
    </div>
  )
}

export default Home
