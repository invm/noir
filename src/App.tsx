'use client';
// import { useState } from "react";
// import { invoke } from "@tauri-apps/api/tauri";
import { DarkThemeToggle, Flowbite } from 'flowbite-react';


function App() {
  // const [greetMsg, setGreetMsg] = useState("");
  // const [name, setName] = useState("");
  //
  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  //   setGreetMsg(await invoke("greet", { name }));
  // }

  return (
    <Flowbite>
      <div className="bg-white dark:bg-gray-800 h-full w-full flex flex-col justify-center items-center">
        <h1 className="text-black dark:text-white">Welcome to Query Noir!</h1>
        <div>
          <DarkThemeToggle />
        </div>
      </div>
    </Flowbite>
  );
}

export default App;
