import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react";

import axios from "./Api";

function Home() {

    const [sessionID, setSessionID] = useState('');
    const [quizID, setQuizID] = useState('');

    const handleJoinSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("join");
    }

    const handleCreateSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("create");
    }

    const handleJoinChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSessionID(e.target.value);
    };

    const handleCreateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuizID(e.target.value);
    };

    return (
        <>
            <form className="join" onSubmit={handleJoinSubmit}>
                <input id="joinInput" className="joinInput" type="number" value={sessionID} onChange={handleJoinChange} placeholder="Session ID" />
                <button type="submit">Join Session</button>
            </form>
            <form className="create" onSubmit={handleCreateSubmit}>
                <input id="createInput" className="createInput" type="number" value={quizID} onChange={handleCreateChange} placeholder="Quiz ID" />
                <button type="submit">Create Session</button>
            </form>
        </>
    )
}

export default Home;