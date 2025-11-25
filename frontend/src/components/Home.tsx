import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./Api";
import { CREATE_LOBBY_URL } from "./Api";
import "../styles/homePage.css"

const Home = () => {
    const navigate = useNavigate();
    const [joinSessionID, setJoinSessionID] = useState("");
    const [quizID, setQuizID] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleCreateLobby = async () => {
        setError(null);
        try {
            const res = await axios.post(CREATE_LOBBY_URL, { quiz_id: Number(quizID) });
            const lobbyId = res.data.game_session_id;
            navigate(`/lobby/${lobbyId}`, { state: { isHost: true } });
        } catch (err: any) {
            setError(err?.response?.data?.error || "Error creating lobby");
        }
    };

    const handleJoinLobby = async () => {
        if (!joinSessionID) return;
        try {
            const res = await axios.get(`/game-sessions/${joinSessionID}/exists`);
            if (!res.data.exists) {
                setError(`Лобби с ID:${joinSessionID} не существует!`);
                return
            }
            navigate(`/lobby/${joinSessionID}`, {state: {isHost : false}});
        } catch (err: any) {
            setError(err)
        }
    };

    return (
        <div className="home-container">
            <h1>Quiz Lobby</h1>

            <div className="home-card">
                <h2>Create Lobby</h2>
                <input
                    type="number"
                    placeholder="Quiz ID"
                    value={quizID}
                    onChange={(e) => setQuizID(e.target.value)}
                />
                <button onClick={handleCreateLobby}>Create Lobby</button>
            </div>

            <div className="home-card">
                <h2>Join Lobby</h2>
                <input
                    type="number"
                    placeholder="Lobby ID"
                    value={joinSessionID}
                    onChange={(e) => setJoinSessionID(e.target.value)}
                />
                <button onClick={handleJoinLobby}>Join Lobby</button>
            </div>

            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Home;
