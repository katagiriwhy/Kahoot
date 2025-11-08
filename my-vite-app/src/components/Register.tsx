import { useState } from 'react';
import { Link } from 'react-router-dom';

import axios from './Api';

const REGISTER_URL = '/register'; //TODO: тот эндпоинт?

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        login: '',
        password: '',
        password2: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        setLoading(true);

        if (formData.password !== formData.password2) {
            alert('Passwords are not identical');
            return;
        }
        if (formData.password.length < 6) {
            alert('Password length must be > 6');
            return;
        }

        console.log('Данные для отправки:', formData);

        axios.post(REGISTER_URL, {
            username: formData.username,
            login: formData.login,
            password: formData.password
        })
            .then(function (response) {
                console.log(response);
                setLoading(false);
            })
            .catch(function (error) {
                console.log(error);
                setLoading(false);
            })
            .finally(function(){
                setLoading(false);
            });
    };

    return (
        <>
            <h1>Register</h1>
            <form className="registerform" onSubmit={handleSubmit}>
                <input id="username" className="username" type="text" placeholder="Login" onChange={handleChange} required />
                <input id="login" className="login" type="text" placeholder="Username" onChange={handleChange} required />
                <input id="password" className="password" type="password" placeholder="Password" onChange={handleChange} required />
                <input id="password2" className="password" type="password" placeholder="Confirm password" onChange={handleChange} required />
                <button type="submit" disabled={loading}>{loading ? "Loading..." : "Submit"}</button>
                <button type="reset">Reset</button>
            </form>
            <Link to={`/login`}>
                <p>Already Registered User? Click here to login </p>
            </Link>
        </>
    )
}

export default Register