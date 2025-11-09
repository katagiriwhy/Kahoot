import { Link } from "react-router-dom";
import "../styles/tempHome.css";

function TempHome() {
    return (
        <div className="temp-container">
            <div className="temp-card">
                <h1 className="title">Temp Home Page</h1>

                <h2 className="subtitle">Pages:</h2>

                <div className="btn-group">
                    <Link to="/login" className="nav-btn">
                        LOGIN
                    </Link>

                    <Link to="/register" className="nav-btn">
                        REGISTER
                    </Link>

                    <Link to="/newquiz" className="nav-btn">
                        NEW QUIZ
                    </Link>
                </div>

                <h3 className="section-title">Under Development:</h3>
                <div className="btn-group">
                    <Link to="/home" className="nav-btn">
                        HOME
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default TempHome;
