import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register'
import Login from './components/Login'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Временно */}
          <Route path="/" element={<Register />} /> 
        </Routes>
      </Router>
    </>
  )
}

export default App
