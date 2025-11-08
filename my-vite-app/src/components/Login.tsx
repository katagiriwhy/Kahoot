import { useState } from 'react';
import { Link } from 'react-router-dom';

import axios from './Api';
import { LOGIN_URL } from './Api';

function Login() {

    const [formData, setFormData] = useState({
        login: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();

            setLoading(true);

            console.log('Данные для отправки:', formData);

            const response = await axios.post(LOGIN_URL, formData);

            localStorage.setItem('token', response.data.token);
        }
        catch (error) {
            console.log(error);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1>Log In</h1>
            <form className="loginform" onSubmit={handleSubmit}>
                <input id="login" className="login" type="text" placeholder="Username" onChange={handleChange} required />
                <input id="password" className="password" type="password" placeholder="Password" onChange={handleChange} required />
                <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Submit'}</button>
                <button type="reset">Reset</button>
            </form>
            <Link to={`/register`}>
                <p>Not Registered Yet? Click here to register </p>
            </Link>
        </>
    )
}

export default Login