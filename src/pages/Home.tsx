import { AddConnectionForm } from '../components/AddConnectionForm';
import { ConnectionsList } from '../components/ConnectionsList';

const Home = () => {
  return (
    <div class="flex-1 flex flex-col">
      <div class="w-full flex flex-1 flex-col">
        <ConnectionsList />
        {/* <AddConnectionForm /> */}
      </div>
    </div>
  )
}

export default Home
