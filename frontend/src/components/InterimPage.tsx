import { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

export function InterimPage() {
    const { questionId } = useParams<{ questionId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isHost = location.state?.isHost ?? false;
    const { subscribe, send } = useSocket();

    useEffect(() => {
        const unsub = subscribe(msg => {
            if (msg.type === "next_question") navigate("/question", { state: { isHost } });
            if (msg.type === "game_finished" || msg.type === "game_results") navigate("/final");
        });
        return unsub;
    }, [subscribe, navigate, isHost]);

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
