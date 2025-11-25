import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/interimPage.css"

type Player = {
    user_id: number;
    nickname: string;
    score: number;
};

export function InterimPage() {
    const { questionId } = useParams<{ questionId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isHost = location.state?.isHost ?? false;
    const { subscribe, send } = useSocket();

    const [correctAnswerText, setCorrectAnswerText] = useState<string>("");
    const [players, setPlayers] = useState<Player[]>([]);
    const navigatedRef = useRef(false);
    const processedQuestionIdsRef = useRef<Set<number>>(new Set());
    const isInitialMountRef = useRef(true);
    const navigationInProgressRef = useRef(false);

    useEffect(() => {
        const currentQuestionId = questionId ? parseInt(questionId) : null;
        if (currentQuestionId) {
            console.log(`[InterimPage] Mounted for question ${currentQuestionId}, resetting navigation state`);
            navigatedRef.current = false;
            navigationInProgressRef.current = false;

            processedQuestionIdsRef.current.add(currentQuestionId);
        }
    }, [questionId]);

    useEffect(() => {

        let skipCached = true;
        const skipTimeout = setTimeout(() => {
            skipCached = false;
            isInitialMountRef.current = false;
        }, 500);
        
        const unsub = subscribe(msg => {
            if (msg.type === "question_end") {

                if (msg.correctAnswerText) {
                    setCorrectAnswerText(msg.correctAnswerText);
                }
                if (msg.players && Array.isArray(msg.players)) {
                    setPlayers(msg.players.map((p: any) => ({
                        user_id: typeof p.user_id === 'string' ? parseInt(p.user_id) : p.user_id,
                        nickname: p.nickname || "",
                        score: typeof p.score === 'string' ? parseInt(p.score) : p.score,
                    })));
                }
            }

            if (msg.type === "question") {
                const newQuestionId = msg.question?.id ?? msg.question?.ID;
                const currentQuestionId = questionId ? parseInt(questionId) : null;

                if (skipCached && isInitialMountRef.current) {
                    console.log(`[InterimPage] Skipping cached question ${newQuestionId} on initial mount`);
                    return;
                }

                if (!location.pathname.startsWith("/interim")) {
                    console.log(`[InterimPage] Not on interim page (${location.pathname}), ignoring question ${newQuestionId}`);
                    return;
                }

                if (navigationInProgressRef.current || navigatedRef.current) {
                    console.log(`[InterimPage] Navigation already in progress or completed, ignoring question ${newQuestionId}`);
                    return;
                }

                if (newQuestionId && 
                    newQuestionId !== currentQuestionId && 
                    !processedQuestionIdsRef.current.has(newQuestionId)) {
                    
                    console.log(`[InterimPage] Navigating to question ${newQuestionId} (viewing results for question ${currentQuestionId})`);
                    navigationInProgressRef.current = true;
                    navigatedRef.current = true;
                    processedQuestionIdsRef.current.add(newQuestionId);

                    navigate("/question", { state: { isHost } });
                }
            }
            if (msg.type === "game_finished" || msg.type === "game_results") {
                if (!navigatedRef.current && !navigationInProgressRef.current && location.pathname.startsWith("/interim")) {
                    navigationInProgressRef.current = true;
                    navigatedRef.current = true;
                    navigate("/final");
                }
            }
        }, { replay: ["question_end", "game_finished", "game_results", "game_over"] });
        
        return () => {
            clearTimeout(skipTimeout);
            unsub();
        };
    }, [subscribe, navigate, isHost, questionId, location]);

    const next = () => {
        if (!isHost) return;
        send("next_question", {  });
    };

    return (
        <div className="interim-container glass-card">
            <header className="interim-header">
                <p>Reviewing question #{questionId}</p>
                <h2>Results</h2>
            </header>

            {correctAnswerText && (
                <section className="correct-block">
                    <h3>Correct Answer</h3>
                    <p>{correctAnswerText}</p>
                </section>
            )}

            <section className="score-block">
                <div className="score-title">
                    <h3>Leaderboard</h3>
                    <span>{players.length} participants</span>
                </div>
                {players.length > 0 ? (
                    <ul className="score-list">
                        {players
                            .sort((a, b) => b.score - a.score)
                            .map((player, index) => (
                                <li key={player.user_id}>
                                    <span className="rank">{index + 1}</span>
                                    <div className="score-player">
                                        <p>{player.nickname}</p>
                                        <small>{player.score} points</small>
                                    </div>
                                </li>
                            ))}
                    </ul>
                ) : (
                    <p className="loading-state">Loading scores...</p>
                )}
            </section>

            {isHost && (
                <button className="host-btn" onClick={next}>
                    Next question
                </button>
            )}
        </div>
    );
}
