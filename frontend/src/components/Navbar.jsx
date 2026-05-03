import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Microscope, Menu, X, BarChart2, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_PUBLIC = [
  { to: '/',        label: 'Home'    },
  { to: '/analyze', label: 'Analyze' },
  { to: '/compare', label: 'Compare' },
]

const NAV_AUTH = [
  { to: '/tracker',   label: 'Tracker'   },
  { to: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
  const { pathname }           = useLocation()
  const navigate               = useNavigate()
  const { user, logout }       = useAuth()
  const [open,    setOpen]     = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  const allNav = user ? [...NAV_PUBLIC, ...NAV_AUTH] : NAV_PUBLIC

  const handleLogout = () => {
    logout()
    setUserMenu(false)
    navigate('/')
  }

  const ROLE_COLOR = {
    clinician:  'text-ds-teal  bg-ds-teal/10  border-ds-teal/30',
    researcher: 'text-ds-amber bg-ds-amber/10 border-ds-amber/30',
    admin:      'text-ds-red   bg-ds-red/10   border-ds-red/30',
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-ds-border bg-ds-bg/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-ds-teal/15 border border-ds-teal/30
                          flex items-center justify-center group-hover:bg-ds-teal/25 transition-colors">
            <Microscope size={16} className="text-ds-teal" />
          </div>
          <span className="font-display font-bold text-lg text-ds-text tracking-tight">
            Derm<span className="text-ds-teal">Scan</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {allNav.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-200
                ${pathname === to
                  ? 'text-ds-teal bg-ds-teal/10'
                  : 'text-ds-muted hover:text-ds-text hover:bg-ds-surface'}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right — auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                           bg-ds-surface border border-ds-border hover:border-ds-teal/40
                           transition-all duration-200 group">
                <div className="w-7 h-7 rounded-lg bg-ds-teal/20 flex items-center justify-center">
                  <User size={13} className="text-ds-teal" />
                </div>
                <div className="text-left">
                  <p className="text-ds-text text-xs font-medium leading-none">{user.name}</p>
                  <p className={`text-[10px] font-mono capitalize mt-0.5 border rounded px-1
                                 ${ROLE_COLOR[user.role] || ROLE_COLOR.clinician}`}>
                    {user.role}
                  </p>
                </div>
                <ChevronDown size={13} className={`text-ds-muted transition-transform ${userMenu ? 'rotate-180' : ''}`} />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 ds-card shadow-2xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-ds-border">
                    <p className="text-xs text-ds-muted truncate">{user.email}</p>
                  </div>
                  <Link to="/analytics" onClick={() => setUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ds-muted
                               hover:text-ds-text hover:bg-ds-surface transition-colors">
                    <BarChart2 size={14} /> Analytics
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                               text-ds-red hover:bg-ds-red/5 transition-colors">
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"    className="btn-ghost text-sm">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-5">Register</Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="md:hidden btn-ghost p-2">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-ds-border bg-ds-surface px-6 py-4 flex flex-col gap-2">
          {allNav.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${pathname === to ? 'text-ds-teal bg-ds-teal/10' : 'text-ds-muted hover:text-ds-text'}`}>
              {label}
            </Link>
          ))}
          <div className="border-t border-ds-border pt-3 mt-1">
            {user ? (
              <>
                <p className="text-xs text-ds-muted px-4 mb-2">{user.email}</p>
                <button onClick={() => { handleLogout(); setOpen(false) }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-ds-red w-full">
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login"    onClick={() => setOpen(false)} className="btn-ghost flex-1 text-center text-sm">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 text-center text-sm py-2">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}