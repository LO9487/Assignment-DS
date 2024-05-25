"use client"
import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';

const CustomSignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const signUp = useSignUp().signUp;

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (!validatePassword(value)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, and a number.');
    } else {
      setError(null);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setError('Password does not meet the requirements.');
      return;
    }
    if (!signUp) {
      setError('Sign up is not available.');
      return;
    }
    try {
      await signUp.create({
        emailAddress: email,
        password: password,
      });
     
    } catch (error: any) {
      setError('Sign up failed: ' + (error.errors ? error.errors[0].message : 'Unknown error'));
    }
  };

  return (
    <div>
      <form onSubmit={handleSignUp}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={handleEmailChange} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={handlePasswordChange} required />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default CustomSignUp;
