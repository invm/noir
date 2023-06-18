'use client';
import { useState, useEffect } from "react";
// import { invoke } from "@tauri-apps/api/tauri";
import { Flowbite, DarkThemeToggle, useThemeMode } from 'flowbite-react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Tabs from './pages/Tabs';


function App() {
  // const [greetMsg, setGreetMsg] = useState("");
  // const [name, setName] = useState("");
  //
  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  //   setGreetMsg(await invoke("greet", { name }));
  // }

  // const [mode, setMode, toggleMode] = useThemeMode();
  // const [dark, setDark] = useState(true);

  // useEffect(() => {
  //   let dark =
  //     localStorage.getItem("theme") === "dark"
  //   // setDark(dark);
  // }, [])

  return (
    <Flowbite>
      <div className="bg h-full w-full flex">
        <BrowserRouter>
          <Routes>
            <Route path="/" Component={Home} />
            <Route path="/tabs" Component={Tabs} />
          </Routes>
        </BrowserRouter>
        {/**
        <DarkThemeToggle onClick={() => {
          toggleMode();
          let newMode = mode == "dark" ? "light" : "dark";
          localStorage.setItem("theme", newMode);
        }} />
        */}
      </div>
    </Flowbite >
  );
}

export default App;
