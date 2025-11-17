import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

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
    const lastQuestionIdRef = useRef<number | null>(null);
    const isMountedRef = useRef(false);

    useEffect(() => {
        // Reset navigation flag when questionId changes
        const currentQuestionId = questionId ? parseInt(questionId) : null;
        if (currentQuestionId && lastQuestionIdRef.current !== currentQuestionId) {
            navigatedRef.current = false;
            lastQuestionIdRef.current = currentQuestionId;
            isMountedRef.current = false; // Reset mount flag for new question
            // Set mounted after delay
            setTimeout(() => {
                isMountedRef.current = true;
            }, 200);
        }
    }, [questionId]);

    useEffect(() => {
        // Mark as mounted after a short delay to distinguish cached vs new messages
        const mountTimeout = setTimeout(() => {
            isMountedRef.current = true;
        }, 200);
        
        let navigationTimeout: ReturnType<typeof setTimeout> | null = null;
        
        const unsub = subscribe(msg => {
            if (msg.type === "question_end") {
                // Update correct answer text and players when question_end is received
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
            // Navigate to question page when a new question is broadcast (only once)
            // Skip if we just mounted (likely a cached message)
            if (msg.type === "question" && !navigatedRef.current && isMountedRef.current) {
                const newQuestionId = msg.question?.id ?? msg.question?.ID;
                // Only navigate if this is a different question than the one we're viewing results for
                const currentQuestionId = questionId ? parseInt(questionId) : null;
                if (newQuestionId && newQuestionId !== currentQuestionId && newQuestionId !== lastQuestionIdRef.current) {
                    // Clear any pending navigation
                    if (navigationTimeout) {
                        clearTimeout(navigationTimeout);
                    }
                    // Use a small timeout to debounce rapid messages
                    navigationTimeout = setTimeout(() => {
                        // Check if we're still on interim page before navigating
                        if (!navigatedRef.current && location.pathname.startsWith("/interim")) {
                            navigatedRef.current = true;
                            lastQuestionIdRef.current = newQuestionId;
                            navigate("/question", { state: { isHost } });
                        }
                    }, 100);
                }
            }
            if (msg.type === "game_finished" || msg.type === "game_results") {
                if (navigationTimeout) {
                    clearTimeout(navigationTimeout);
                }
                if (!navigatedRef.current) {
                    navigatedRef.current = true;
                    navigate("/final");
                }
            }
        });
        
        return () => {
            clearTimeout(mountTimeout);
            unsub();
            if (navigationTimeout) {
                clearTimeout(navigationTimeout);
            }
        };
    }, [subscribe, navigate, isHost, questionId, location]);

    const next = () => {
        if (!isHost) return;
        send("next_question", { /* server expects session and will verify host */ });
    };

    return (
        <div>
            <h2>Results for question {questionId}</h2>
            
            {correctAnswerText && (
                <div>
                    <h3>Correct Answer:</h3>
                    <p>{correctAnswerText}</p>
                </div>
            )}

            <div>
                <h3>Current Scores:</h3>
                {players.length > 0 ? (
                    <ul>
                        {players
                            .sort((a, b) => b.score - a.score) // Sort by score descending
                            .map((player) => (
                                <li key={player.user_id}>
                                    {player.nickname}: {player.score} point{player.score !== 1 ? 's' : ''}
                                </li>
                            ))}
                    </ul>
                ) : (
                    <p>Loading scores...</p>
                )}
            </div>

            {isHost && <button onClick={next}>Next question</button>}
        </div>
    );
}
