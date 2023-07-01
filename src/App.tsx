import './utils/i18n';
import Home from './pages/Home';
import { Route, Router, Routes } from "@solidjs/router"; // 👈 Import the router
import Connection from './pages/Connection';
import { StoreProvider } from './services/Context';
import { Alerts } from './components/Alerts';

function App() {
  return (
    <StoreProvider>
      <Router>
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/connection" component={Connection} />
        </Routes>
      </Router>
      <Alerts />
    </StoreProvider>
  );
}

export default App;
