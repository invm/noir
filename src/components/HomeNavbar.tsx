import { Navbar, Dropdown } from 'flowbite-react';
import { useTranslation } from "react-i18next";
import { DarkThemeToggle, useThemeMode } from 'flowbite-react';

const HomeNavbar = () => {
  const { t } = useTranslation();
  const [mode, setMode, toggleMode] = useThemeMode();
  return (
    <Navbar fluid className="bg-white dark:bg-slate-800">
      <Navbar.Brand href="/">
        <img
          alt="query noir logo"
          className="mr-4 rounded-full"
          style={{ width: "60px" }}
          src="/logo2.png"
        />
        <span className="self-center text whitespace-nowrap text-2xl font-semibold">
          {t('query_noir_titlecase')}
        </span>
      </Navbar.Brand>
      <div className="flex md:order-2 items-center gap-2">
        <DarkThemeToggle onClick={() => {
          toggleMode();
          let newMode = mode == "dark" ? "light" : "dark";
          localStorage.setItem("theme", newMode);
        }} />
        <Dropdown size={"xs"} label={<span className="font-semibold">Actions</span>}>
          <Dropdown.Item>
            {t('home.add_connection')}
          </Dropdown.Item>
        </Dropdown>
      </div>
    </Navbar>

  )
}

export default HomeNavbar
