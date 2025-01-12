import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../App.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Auth = ({ onAuthChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      const user = data.user;
      const { error: insertError } = await supabase.from('users').insert([{
        id: user.id,
        email: user.email,
        role: 'parent',
        player_id: null
      }]);
      if (insertError) {
        setError(insertError.message);
      } else {
        setMessage('Sign-up successful! Please check your email for confirmation.');
        onAuthChange(true);
      }
    }
  };

  const handleLogIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Log-in successful!');
      onAuthChange(true);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onAuthChange(true);
      }
    };
    checkSession();
  }, [onAuthChange]);

  return (
    <div className="auth-container">
      <h2>Sign Up / Log In</h2>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignUp}>Sign Up</button>
      <button onClick={handleLogIn}>Log In</button>
    </div>
  );
};

export default Auth;
