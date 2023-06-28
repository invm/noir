import { A } from '@solidjs/router';
import { AddConnectionForm } from '../components/AddConnectionsForm';
import { Button, Card } from '../components/UI';

const Home = () => {
  const connections = [
    { name: "Local", address: "127.0.0.1:5432", default_db: "example", color: 'orange' },
    { name: "Staging", address: "https://staging.com/", default_db: "example", color: 'red' },
    { name: "QaStaging", address: "https://qastaging.com/", default_db: "example", color: 'indigo' },
    { name: "QaStaging", address: "https://qastaging.com/", default_db: "example", color: 'blue' },
  ]
  return (
    <div class="flex-1 flex flex-col">
      <div class="w-full flex flex-1 flex-col">
        <div class="flex-2 p-3">
          <div class="grid grid-cols-3 xl:grid-cols-4 gap-4 ">
            {connections.map((conn) => (
              <Card style={{ borderColor: conn.color }}>
                <h5 class="text text-2xl font-bold">{conn.name}</h5>
                <div>
                  <p class="text my-0 ">{conn.address}</p>
                  <p class="text ">{conn.default_db}</p>
                </div>
                <Button class="bg-sky-600 hover:bg-sky-800 dark:bg-lime-600 dark:hover:bg-lime-700" >Click me</Button>
              </Card>
            ))}
          </div>
        </div>
        <AddConnectionForm />
        <A href="/connection">Connection</A>
      </div>
    </div>
  )
}

export default Home
