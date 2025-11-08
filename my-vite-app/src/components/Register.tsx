import { useState } from 'react';
import axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        login: '',
        password: '',
        password2: ''
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.password !== formData.password2) {
            alert('Passwords are not identical');
            return;
        }
        if (formData.password.length < 6) {
            alert('Password length must be > 6');
            return;
        }

        console.log('Данные для отправки:', formData);

        axios.post('/user', { //TODO: добавить эндпоинт
            username: formData.username,
            login: formData.login,
            password: formData.password
        })
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    };



    return (
        <>
            <h1>Register</h1>
            <form className="register" onSubmit={handleSubmit}>
                <input id="username" className="username" type="text" placeholder="Login" onChange={handleChange} required />
                <input id="login" className="login" type="text" placeholder="Username" onChange={handleChange} required />
                <input id="password" className="password" type="password" placeholder="Password" onChange={handleChange} required />
                <input id="password2" className="password" type="password" placeholder="Confirm password" onChange={handleChange} required />
                <button type="submit">Submit</button>
                <button type="reset">Reset</button>
            </form>

        </>
    )
}

export default Register