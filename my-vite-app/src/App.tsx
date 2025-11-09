import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register'
import Login from './components/Login'
import NewQuiz from './components/NewQuiz';
import TempHome from './components/TempHome';
import Home from './components/Home';

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<TempHome />} /> 
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/newquiz" element={<NewQuiz />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
