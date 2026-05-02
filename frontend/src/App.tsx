import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register'
import Login from './components/Login'
import TempHome from './components/TempHome';
import Home from './components/Home';
import QuizCreate from "./components/QuizCreate.tsx";
import CreateQuestions from "./components/CreateQuestions.tsx";
import Lobby from "./components/Lobby.tsx";
import { SocketProvider } from './context/SocketContext';
import {QuestionPage} from "./components/QuestionPage.tsx";
import {InterimPage} from "./components/InterimPage.tsx";
import {FinalPage} from "./components/FinalPage.tsx";

function App() {
    return (
        <SocketProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<TempHome />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/newquiz" element={<QuizCreate />} />
                    <Route path="/new-question" element={<CreateQuestions />} />
                    <Route path="/lobby/:id" element={<Lobby />} />

                    <Route path="/question" element={<QuestionPage />} />
                    <Route path="/interim/:questionId" element={<InterimPage />} />
                    <Route path="/final" element={<FinalPage />} />
                </Routes>
            </Router>
        </SocketProvider>
    )
}

export default App;
