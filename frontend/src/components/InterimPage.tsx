import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

export function InterimPage({ isHost }: { isHost: boolean }) {
    const { questionId } = useParams<{ questionId: string }>();
    const navigate = useNavigate();
    const { subscribe, send } = useSocket();

    useEffect(() => {
        const unsub = subscribe(msg => {
            if (msg.type === "next_question") navigate("/question");
            if (msg.type === "game_finished" || msg.type === "game_results") navigate("/final");
        });
        return unsub;
    }, [subscribe, navigate]);

    const next = () => {
        if (!isHost) return;
        send("next_question", { /* server expects session and will verify host */ });
    };

    return (
        <div>
            <h2>Results for question {questionId}</h2>
            {isHost && <button onClick={next}>Next question</button>}
        </div>
    );
}
