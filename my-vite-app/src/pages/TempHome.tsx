import { Link } from "react-router-dom";

function TempHome() {

    return (
        <>
            <h1>Temp Home Page</h1>
            <h2>Pages: </h2>
            <h3>Done: </h3>
            <Link to={`/login`}>
                <p>LOGIN </p>
            </Link>
            <Link to={`/register`}>
                <p>REGISTER </p>
            </Link>
            <Link to={`/newquiz`}>
                <p>NEW QUIZ </p>
            </Link>
            <Link to={`/home`}>
                <p>HOME </p>
            </Link>
            <Link to={`/quiz/1`}>
                <p>QUIZ </p>
            </Link>
            <h3>Under development: </h3>
        </>
    )
}

export default TempHome;