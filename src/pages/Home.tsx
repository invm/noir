// import { Link } from "react-router-dom"
import { Navbar, Card } from 'flowbite-react';
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();
  const connections = [
    { name: "Local", address: "127.0.0.1:5432", default_db: "example", color: 'orange' },
    { name: "Staging", address: "https://asd.com/", default_db: "example", color: 'red' },
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
              <Card className="gap-1 border-2">
                <h5 className="text">{conn.name}</h5>
                <div>
                  <p className="text my-0">{conn.address}</p>
                  <p className="text">{conn.default_db}</p>
                </div>
              </Card>
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
