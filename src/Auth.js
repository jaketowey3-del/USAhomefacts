import React, { useState } from 'react';

export default function Auth({ supabaseClient, setLoading, loading, onSignUpSuccess, onSignInSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const { error } = await supabaseClient.auth.signUp({ email, password });
    
    if (error) {
      alert(error.message);
    } else {
      onSignUpSuccess();
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      onSignInSuccess();
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Please enter your email address above to reset your password.');
      return;
    }
    setLoading(true);
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) alert(error.message);
    else alert('Check your email for password reset instructions!');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=2000")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '20px'
    }}>
      <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
      <h2>Welcome to USAHomeFacts, lets Get Started</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
          Fill out an email and password to login or create a profile! (app is still in development)
        </p>

        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
        />
        
        <button 
          onClick={handleForgotPassword}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', marginBottom: '20px', display: 'block', width: '100%', textAlign: 'right' }}
        >
          Forgot password?
        </button>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSignIn} 
            disabled={loading} 
            style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', background: '#334155', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? '...' : 'Sign In'}
          </button>
          <button 
            onClick={handleSignUp} 
            disabled={loading} 
            style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? '...' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}