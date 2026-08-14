import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registration successful! You can now log in.');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(-1); // Sends them back to the product page they came from!
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-24">
      <h1 className="font-display text-3xl text-maroon mb-6">
        {isRegistering ? 'Create an account' : 'Customer Login'}
      </h1>
      <form onSubmit={handleAuth} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-3.5 bg-maroon text-ivory rounded-md">
          {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Log In')}
        </button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-sm text-ink/60 underline">
        {isRegistering ? 'Already have an account? Log in' : 'Need an account? Sign up'}
      </button>
    </div>
  );
}
