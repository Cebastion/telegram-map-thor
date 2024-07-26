import { Route, Routes } from 'react-router-dom'
import './App.css';
import Map from './components/Map'

function App() {
  return (
    <Routes>
      <Route path="/tour/:NameThor?" element={<Map />} />
    </Routes>
  );
}

export default App;
