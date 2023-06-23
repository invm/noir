// import { Link } from "react-router-dom"
import { Navbar, Button } from 'flowbite-react';
import AddConnectionForm from '../components/AddConnectionForm';
import Card from '../components/Card';
import HomeNavbar from '../components/HomeNavbar';

const Home = () => {
  const connections = [
    { name: "Local", address: "127.0.0.1:5432", default_db: "example", color: 'orange' },
    { name: "Staging", address: "https://staging.com/", default_db: "example", color: 'red' },
    { name: "QaStaging", address: "https://qastaging.com/", default_db: "example", color: 'indigo' },
    { name: "QaStaging", address: "https://qastaging.com/", default_db: "example", color: 'blue' },
  ]
  return (
    <div className="flex-1 flex flex-col">
      <HomeNavbar />
      <div className="w-full flex flex-1 flex-col">
        {/*
        <div className="flex-2 p-3">
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 ">
            {connections.map((conn) => (
              <Card key={conn.name + conn.address} style={{ borderColor: conn.color }}>
                <h5 className="text text-2xl font-bold">{conn.name}</h5>
                <div>
                  <p className="text my-0 ">{conn.address}</p>
                  <p className="text ">{conn.default_db}</p>
                </div>
                <Button className="bg-sky-600 hover:bg-sky-800 dark:bg-lime-600 dark:hover:bg-lime-700" >Click me</Button>
              </Card>
            ))}
          </div>
        </div>
        */}
        <div className="flex justify-center items-start flex-1 py-10">
          <div className="w-80">
            <AddConnectionForm />
          </div>
        </div>
      </div>
      {/*
      <div>
        <Link to="/tabs" className="text">Tabs</Link>
      </div>
      */}
    </div>
  )
}

export default Home
