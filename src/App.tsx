import 'flowbite';
import './utils/i18n';
import Home from './pages/Home';
import { Route, Router, Routes } from "@solidjs/router"; // 👈 Import the router
import Connection from './pages/Connection';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/connection" component={Connection} />
      </Routes>
    </Router>
  );
}

export default App;
