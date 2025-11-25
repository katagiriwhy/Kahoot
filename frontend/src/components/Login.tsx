import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/login.css";
import api, { LOGIN_URL } from "./Api";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        login: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [id]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log("Sending:", formData);

            const response = await api.post(LOGIN_URL, formData, {
                withCredentials: true,
            });

            localStorage.setItem("token", response.data.token || "");
            navigate("/");

            console.log("✅ Login successful!", response.data);

            navigate("/");
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.error || "Ошибка входа");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h1 className="login-title">Log In</h1>

            <form className="loginform" onSubmit={handleSubmit}>
                <input
                    id="login"
                    type="text"
                    placeholder="Login"
                    value={formData.login}
                    onChange={handleChange}
                    required
                />

                <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                {error && <p className="login-error">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Submit"}
                </button>

                <button type="reset" className="secondary-btn">
                    Reset
                </button>
            </form>

            <Link to="/register">
                <p className="register-text">Not registered yet? Click here</p>
            </Link>
        </div>
    );
}

export default Login;
