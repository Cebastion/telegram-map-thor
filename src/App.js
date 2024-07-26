import { Route, Routes } from 'react-router-dom'
import './App.css';
import Map from './components/Map'

function App() {
  return (
    <Routes>
      <Route path="/:NameThor?" element={<Map />} />
    </Routes>
  );
}

export default App;
