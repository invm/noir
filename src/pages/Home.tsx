// import { Link } from "react-router-dom"
import { Navbar, Card, Button } from 'flowbite-react';
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();
  const connections = [
    { name: "Local", address: "127.0.0.1:5432", default_db: "example", color: 'orange' },
    { name: "Staging", address: "https://staging.com/", default_db: "example", color: 'red' },
    { name: "QaStaging", address: "https://qastaging.com/", default_db: "example", color: 'red' },
    { name: "QaStaging", address: "https://qastaging.com/", default_db: "example", color: 'red' },
  ]
  return (
    <div className="flex-1">
      <Navbar fluid>
        <Navbar.Brand href="/">
          <img
            alt="Flowbite React Logo"
            className="mr-4 rounded-full"
            style={{ width: "60px" }}
            src="/logo2.png"
          />
          <span className="self-center text whitespace-nowrap text-2xl font-semibold">
            {t('query_noir_titlecase')}
          </span>
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Navbar.Link href="#" className="text text-xl">
            {t('home.add_connection')}
          </Navbar.Link>
        </Navbar.Collapse>
      </Navbar>
      <div className="h-full w-full flex">
        <div className="flex-1 p-3">
          <div className="grid grid-cols-3 gap-4">
            {connections.map((conn) => (
              <a href="#" className="block max-w-sm p-3 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">

                <h5 className="text">{conn.name}</h5>
                <div>
                  <p className="text my-0 font-bold">{conn.address}</p>
                  <p className="text ">{conn.default_db}</p>
                </div>
                <Button className="bg-orange-500 hover:bg-red-600">Click me</Button>
              </a>
            ))}
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
