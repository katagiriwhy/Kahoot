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
    const processedQuestionIdsRef = useRef<Set<number>>(new Set());
    const isInitialMountRef = useRef(true);
    const navigationInProgressRef = useRef(false);

    useEffect(() => {
        // Reset navigation flag when questionId changes (new interim page for new question)
        const currentQuestionId = questionId ? parseInt(questionId) : null;
        if (currentQuestionId) {
            console.log(`[InterimPage] Mounted for question ${currentQuestionId}, resetting navigation state`);
            navigatedRef.current = false;
            navigationInProgressRef.current = false;
            // Mark the current question as processed so we don't navigate to it from cache
            processedQuestionIdsRef.current.add(currentQuestionId);
        }
    }, [questionId]);

    useEffect(() => {
        // Skip cached messages on initial mount - use a longer delay to ensure we skip cached
        let skipCached = true;
        const skipTimeout = setTimeout(() => {
            skipCached = false;
            isInitialMountRef.current = false;
        }, 500);
        
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
            // Navigate to question page when a new question is broadcast
            if (msg.type === "question") {
                const newQuestionId = msg.question?.id ?? msg.question?.ID;
                const currentQuestionId = questionId ? parseInt(questionId) : null;
                
                // Skip cached messages on initial mount
                if (skipCached && isInitialMountRef.current) {
                    console.log(`[InterimPage] Skipping cached question ${newQuestionId} on initial mount`);
                    return;
                }
                
                // Check if we're still on the interim page (not already navigating)
                if (!location.pathname.startsWith("/interim")) {
                    console.log(`[InterimPage] Not on interim page (${location.pathname}), ignoring question ${newQuestionId}`);
                    return;
                }
                
                // Prevent multiple simultaneous navigations
                if (navigationInProgressRef.current || navigatedRef.current) {
                    console.log(`[InterimPage] Navigation already in progress or completed, ignoring question ${newQuestionId}`);
                    return;
                }
                
                // Only navigate if:
                // 1. We have a valid question ID
                // 2. It's different from the question we're viewing results for
                // 3. We haven't already processed this question
                if (newQuestionId && 
                    newQuestionId !== currentQuestionId && 
                    !processedQuestionIdsRef.current.has(newQuestionId)) {
                    
                    console.log(`[InterimPage] Navigating to question ${newQuestionId} (viewing results for question ${currentQuestionId})`);
                    navigationInProgressRef.current = true;
                    navigatedRef.current = true;
                    processedQuestionIdsRef.current.add(newQuestionId);
                    
                    // Navigate immediately
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
        });
        
        return () => {
            clearTimeout(skipTimeout);
            unsub();
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
