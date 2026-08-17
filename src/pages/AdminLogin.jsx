import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Enter both email and password.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        // Surface the real reason — e.g. "Invalid login credentials",
        // "Email not confirmed", or a network/env error — instead of
        // hiding it behind a generic message.
        setError(error.message)
        return
      }
      if (!data?.session) {
        setError('Login did not return a session. Please try again.')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError('Could not reach the server: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-24">
      <h1 className="font-display text-3xl text-maroon mb-2">Admin login</h1>
      <p className="text-ink/60 mb-8 text-sm">For the shop owner only.</p>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
