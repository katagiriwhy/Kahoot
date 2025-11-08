//   import React, { useState } from 'react';
  
//   const handleSubmit = async () => {
//     alert("submit");
//   };

function Register () {
    return (
        <>
            <h1>Register</h1>
            <form className="register" onSubmit={handleSubmit}>
                <input id="login" className="login" type="text" placeholder="Username" required />
                <input id="username" className="username" type="text" placeholder="Login" required />
                <input id="password" className="password" type="password" placeholder="Password" required />
                <input id="password2" className="password" type="password" placeholder="Confirm password" required />
                <button type="submit">Submit</button>
                <button type="reset">Reset</button>
            </form>
        </>
    )
}

export default Register