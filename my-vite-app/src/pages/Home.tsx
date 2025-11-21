import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import axios from "../components/Api";
import { JOIN_URL, CREATE_URL } from '../components/Api';

function Home() {
    const navigate = useNavigate();

    const [sessionID, setSessionID] = useState('');
    const [quizID, setQuizID] = useState('');

    const handleJoinSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Trying to join to: ", sessionID);
        axios.post(JOIN_URL, sessionID)
        .then(function(response){
            console.log(response);
            navigate(`/quiz/${sessionID}`);
        })
        .catch(function(error){
            console.log(error);
        })
    }

    const handleCreateSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Trying to create session with quizId: ", quizID);
        axios.post(CREATE_URL, quizID)
        .then(function(response){
            console.log(response);
            const createdSessionID = response.data.sessionID;
            navigate(`/quiz/${createdSessionID}`);
        })
        .catch(function(error){
            console.log(error);
        })
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
                <input id="joinInput" className="joinInput" type="number" value={sessionID} onChange={handleJoinChange} placeholder="Session ID" required />
                <button type="submit">Join Session</button>
            </form>
            <form className="create" onSubmit={handleCreateSubmit}>
                <input id="createInput" className="createInput" type="number" value={quizID} onChange={handleCreateChange} placeholder="Quiz ID" required />
                <button type="submit">Create Session</button>
            </form>
        </>
    )
}

export default Home;