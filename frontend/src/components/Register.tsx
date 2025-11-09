import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { REGISTER_URL } from "./Api";
import "../styles/register.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        login: "",
        password: "",
        password2: "",
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
        setError(null);

        const { username, login, password, password2 } = formData;

        if (password !== password2) {
            setError("Passwords are not identical");
            return;
        }

        if (password.length < 6) {
            setError("Password length must be > 6");
            return;
        }

        setLoading(true);

        try {
            await api.post(REGISTER_URL, {
                username,
                login,
                password,
            });

            navigate("/login");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <h1 className="register-title">Register</h1>

            <form className="registerform" onSubmit={handleSubmit}>
                <input
                    id="username"
                    type="text"
                    placeholder="Name"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />

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

                <input
                    id="password2"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.password2}
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

            <Link to="/login">
                <p className="register-text">Already registered? Login</p>
            </Link>
        </div>
    );
}

export default Register;
