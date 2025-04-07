import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Users from './pages/Users';
import Users1C from './pages/Users1C';
import Partners from './pages/Partners';

function App() {
  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users1c" element={<Users1C />} />
        <Route path="/partners" element={<Partners />} />
      </Routes>
  );
}

export default App;