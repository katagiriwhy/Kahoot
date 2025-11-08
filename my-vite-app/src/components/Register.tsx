import { useState } from 'react';

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
            alert('Пароли не совпадают!');
            return;
        }

        if (formData.password.length < 6) {
            alert('Пароль должен содержать минимум 6 символов');
            return;
        }

        console.log('Данные для отправки:', formData);        
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