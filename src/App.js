import { Route, Routes } from 'react-router-dom'
import './App.css';
import Map from './components/Map'
import MapTest from './components/MapTest'

function App() {
  return (
    <Routes>
      <Route path="/tour/:NameThor?" element={<Map />} />
      <Route path="/tour/test/:NameThor?" element={<MapTest />} />
    </Routes>
  );
}

export default App;
