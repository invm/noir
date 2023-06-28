import 'flowbite';
import './utils/i18n';
import Home from './pages/Home';
import { Route, Router, Routes } from "@solidjs/router"; // 👈 Import the router
import Tabs from './pages/Tabs';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/connection" component={Tabs} />
      </Routes>
    </Router>
  );
}

export default App;
