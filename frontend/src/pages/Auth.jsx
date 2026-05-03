import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Microscope, Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Field({ icon: Icon, type='text', placeholder, value, onChange, show, onToggle }) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ds-muted" />
      <input
        type={type === 'password' ? (show ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-ds-surface border border-ds-border rounded-xl pl-10 pr-10 py-3
                   text-ds-text text-sm outline-none placeholder:text-ds-muted
                   focus:border-ds-teal/50 transition-colors"
      />
      {type === 'password' && (
        <button type="button" onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ds-muted hover:text-ds-text">
          {show ? <EyeOff size={14}/> : <Eye size={14}/>}
        </button>
      )}
    </div>
  )
}

export default function Auth({ mode = 'login' }) {
  const nav = useNavigate()
  const { login, register } = useAuth()

  const [email,    setEmail]    = useState('')
  const [name,     setName]     = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState('clinician')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const isLogin = mode === 'login'

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, name, password, role)
      }
      nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-ds-teal/15 border border-ds-teal/30
                          flex items-center justify-center mx-auto mb-4">
            <Microscope size={26} className="text-ds-teal" />
          </div>
          <h1 className="font-display font-bold text-3xl text-ds-text">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-ds-muted text-sm mt-2">
            {isLogin ? 'Sign in to your DermScan account' : 'Start analysing lesions with AI'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="ds-card p-8 space-y-4">

          {!isLogin && (
            <Field icon={User} placeholder="Full name" value={name}
                   onChange={e => setName(e.target.value)} />
          )}

          <Field icon={Mail} type="email" placeholder="Email address"
                 value={email} onChange={e => setEmail(e.target.value)} />

          <Field icon={Lock} type="password" placeholder="Password"
                 value={password} onChange={e => setPassword(e.target.value)}
                 show={showPw} onToggle={() => setShowPw(!showPw)} />

          {!isLogin && (
            <div>
              <label className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-2 block">
                Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['clinician','researcher','admin'].map(r => (
                  <button key={r} type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-lg text-xs font-medium capitalize border transition-all
                      ${role === r
                        ? 'border-ds-teal text-ds-teal bg-ds-teal/10'
                        : 'border-ds-border text-ds-muted hover:text-ds-text'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-2 p-3 rounded-xl bg-ds-red/10 border border-ds-red/25
                            text-ds-red text-sm">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none">
            {loading
              ? <><div className="w-4 h-4 border-2 border-ds-bg/30 border-t-ds-bg rounded-full animate-spin"/>
                  {isLogin ? 'Signing in…' : 'Creating account…'}</>
              : isLogin ? 'Sign in' : 'Create account'}
          </button>

          <p className="text-center text-sm text-ds-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link to={isLogin ? '/register' : '/login'}
              className="text-ds-teal hover:underline font-medium">
              {isLogin ? 'Register' : 'Sign in'}
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-ds-muted mt-6">
          Demo: register any email/password to get started
        </p>
      </div>
    </div>
  )
}