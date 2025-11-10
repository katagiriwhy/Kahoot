import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register'
import Login from './components/Login'
import TempHome from './components/TempHome';
import Home from './components/Home';
import QuizCreate from "./components/QuizCreate.tsx";
import CreateQuestions from "./components/CreateQuestions.tsx";

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<TempHome />} /> 
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/newquiz" element={<QuizCreate />} />
          <Route path="/new-question" element={<CreateQuestions />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
