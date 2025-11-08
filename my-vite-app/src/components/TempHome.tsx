import { Link } from "react-router-dom";

function TempHome () {

    return (
        <>
            <h1>Temp Home Page</h1>
            <h2>Pages: </h2>
            <Link to={`/login`}>
                <p>LOGIN </p>
            </Link>
            <Link to={`/register`}>
                <p>REGISTER </p>
            </Link>
        </>
    )
}

export default TempHome;