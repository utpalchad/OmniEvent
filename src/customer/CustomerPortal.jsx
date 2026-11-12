import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function CustomerPortal() {
  const path = window.location.pathname;
  const kind = path.endsWith('/register') ? 'register' : path.endsWith('/forgot-password') ? 'forgot' : 'login';
  const isRegister = kind === 'register';
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (event) => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Supabase is not configured. Check the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables in Render.');
      return;
    }
    setBusy(true);
    try {
      if (kind === 'register') {
        if ((form.password || '').length < 8) throw new Error('Use a password of at least 8 characters.');
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.full_name, role: 'customer' },
            emailRedirectTo: window.location.origin + '/customer/login'
          }
        });
        if (error) throw error;
        setMessage('Account created. Check your email to confirm your address, then sign in.');
      } else if (kind === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: window.location.origin + '/customer/login'
        });
        if (error) throw error;
        setMessage('Password-reset email sent if this address is registered.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (error) throw error;
        window.location.assign('/');
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="vp-auth">
    <a className="vp-brand" href="/">p.<b>pact<span>ai</span></b><small>CUSTOMER ACCESS</small></a>
    <section className="vp-card">
      <p className="vp-kicker">PACTAI EVENT PLANNER</p>
      <h1>{isRegister ? 'Create your account.' : kind === 'forgot' ? 'Reset your password.' : 'Welcome back.'}</h1>
      <p>{isRegister ? 'Sign up to save your event plan and contact event professionals.' : 'Sign in to continue planning and send enquiries to vendors.'}</p>
      <form onSubmit={submit}>
        {isRegister && <input name="full_name" required placeholder="Full name" onChange={change} />}
        <input name="email" type="email" required placeholder="Email address" onChange={change} />
        {kind !== 'forgot' && <input name="password" type="password" required minLength="8" placeholder="Password (at least 8 characters)" onChange={change} />}
        <button className="vp-primary" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create customer account' : kind === 'forgot' ? 'Send reset link' : 'Sign in'}</button>
      </form>
      {message && <p className="vp-message" role="status">{message}</p>}
      <p className="vp-switch">
        {isRegister ? <>Already registered? <a href="/customer/login">Sign in</a></> :
          kind === 'forgot' ? <>Remembered your password? <a href="/customer/login">Sign in</a></> :
          <>New to PactAI? <a href="/customer/register">Create account</a></>}
      </p>
      {kind === 'login' && <p className="vp-switch"><a href="/customer/forgot-password">Forgot password?</a></p>}
      <p className="vp-switch"><a href="/">Back to event planner</a></p>
    </section>
  </main>;
}
