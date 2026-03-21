import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CharacterCreate from './pages/CharacterCreate';
import ScenarioSelect from './pages/ScenarioSelect';
import Simulation from './pages/Simulation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScenarioSelect />} />
        <Route path="/characters" element={<CharacterCreate />} />
        <Route path="/simulation" element={<Simulation />} />
      </Routes>
    </BrowserRouter>
  );
}
