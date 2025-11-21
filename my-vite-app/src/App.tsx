import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home, Login, Register, NewQuiz, TempHome, Quiz } from './pages';

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
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
