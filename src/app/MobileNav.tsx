import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

/**
 * M10.4: thumb-friendly bottom navigation for small screens (the header nav
 * takes over from `sm` up). Four first-class sections get tabs; the rest live
 * behind a "More" sheet. Emoji icons match the app's existing iconography
 * (Appearance section, theme toggle). NOTE: the scrim is bg-black/40 on
 * purpose — the slate-900 token flips to a LIGHT value in dark mode and would
 * produce an inverted (white) overlay.
 */

const PRIMARY = [
  { to: '/', label: 'Today', icon: '🏠', end: true },
  { to: '/vocab', label: 'Vocab', icon: '📚', end: false },
  { to: '/review', label: 'Review', icon: '🔁', end: false },
  { to: '/conversation', label: 'Talk', icon: '💬', end: false },
]

const SECONDARY = [
  { to: '/practice', label: 'Speak & Listen', icon: '🎧' },
  { to: '/tutor', label: 'Tutor chat', icon: '🎓' },
  { to: '/writing', label: 'Free writing', icon: '✍️' },
  { to: '/mistakes', label: 'Mistake bank', icon: '📌' },
  { to: '/insights', label: 'Insights', icon: '📊' },
  { to: '/grammar', label: 'Grammar', icon: '📖' },
  { to: '/words', label: 'Word bank', icon: '🗂️' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const moreActive = SECONDARY.some(
    (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  )

  // Any navigation (tab, header link, footer link) closes the sheet.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Esc closes the sheet, like a menu.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      {open && (
        <nav aria-label="More sections" className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
          <div className="rounded-t-2xl border-t border-slate-200 bg-surface px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 shadow-lg">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              More
            </p>
            <ul className="space-y-1">
              {SECONDARY.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    <span aria-hidden="true" className="text-lg">
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur sm:hidden"
      >
        <ul className="mx-auto grid max-w-4xl grid-cols-5">
          {PRIMARY.map((item) => (
            <li key={item.to} className="contents">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                  }`
                }
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="More sections"
              className={`flex w-full flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                open || moreActive
                  ? 'text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ⋯
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}