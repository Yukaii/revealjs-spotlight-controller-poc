import { Router, Route } from "wouter";
import { useLocationProperty, navigate } from "wouter/use-location";
import Home from './pages/Home'
import Controller from './pages/Controller'

const hashLocation = () => window.location.hash.replace(/^#/, "") || "/";

const hashNavigate = (to: string) => navigate("#" + to);

const useHashLocation = () => {
  const location = useLocationProperty(hashLocation);
  return [location, hashNavigate];
};

const App = () => (
  <Router hook={useHashLocation as any}>
    <Route path="/controller" component={Controller} />
    <Route path="/" component={Home} />
  </Router>
);

export default App;
