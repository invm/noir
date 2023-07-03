import './utils/i18n';
import { useAppSelector } from './services/Context';
import { Alerts } from './components/UI';
import { For } from 'solid-js';
import { Console } from './components/main/Console';

function App() {
  const { tabsService: { tabsStore, setActiveTab, removeTab } } = useAppSelector()

  const closeTab = async (id: string) => {
    await removeTab(id)
    setActiveTab(1)
  }

  return (
    <div class="w-full h-full flex flex-col">
      <Console />
    </div>
  );
}

export default App;
