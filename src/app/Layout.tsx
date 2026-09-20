import { NavLink, Outlet } from 'react-router-dom'
import { useAppStore } from '../state/store'
import { APP_VERSION } from '../version'

const NAV_ITEMS = [
  { to: '/', label: 'Today', end: true },
  { to: '/vocab', label: 'Vocabulary', end: false },
  { to: '/words', label: 'Word bank', end: false },
  { to: '/grammar', label: 'Grammar', end: false },
  { to: '/review', label: 'Review', end: false },
  { to: '/conversation', label: 'Conversation', end: false },
  { to: '/settings', label: 'Settings', end: false },
]

export default function Layout() {
  const profile = useAppStore((s) => s.profile)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <span className="text-xl font-bold text-indigo-700">DeutschMeister</span>
          {profile && (
            <span className="ml-auto hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 sm:inline">
              {profile.name} · {profile.level}
            </span>
          )}
        </div>
        <nav className="mx-auto max-w-4xl overflow-x-auto px-4 pb-2">
          <ul className="flex gap-1 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 pt-2 text-center text-xs text-slate-400">
        Local-first: all progress and keys stay in this browser · v{APP_VERSION}
      </footer>
    </div>
  )
}
