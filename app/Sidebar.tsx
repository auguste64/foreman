'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', emoji: '🏠' },
  { href: '/dashboard/chantiers', label: 'Chantiers', emoji: '🏗️' },
  { href: '/dashboard/comptes-rendus', label: 'Comptes rendus', emoji: '📋' },
  { href: '/dashboard/artisans', label: 'Artisans', emoji: '👷' },
  { href: '/dashboard/planning', label: 'Planning', emoji: '📅' },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col h-full border-r border-[#1E1E1C] bg-[#0D0D0B]">
      {/* Logo */}
      <div className="p-6 border-b border-[#1E1E1C]">
        <Link href="/dashboard" className="text-[#E8C547] font-black text-xl tracking-widest hover:opacity-80 transition-opacity" style={{ fontFamily: 'var(--font-syne)' }}>
          FOREMAN
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[rgba(232,197,71,0.08)] hover:text-[#E8C547] hover:translate-x-1 ${
                isActive
                  ? 'bg-[rgba(232,197,71,0.1)] text-[#E8C547] shadow-[inset_3px_0_0_#E8C547]'
                  : 'text-[#7A7870]'
              }`}
            >
              <span className="text-base transition-transform duration-200 group-hover:scale-125">{item.emoji}</span>
              {item.label}
            </Link>
          )
        })}

        <div className="border-t border-[#1E1E1C] my-2" />

        <Link
          href="/dashboard/parametres"
          className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[rgba(232,197,71,0.08)] hover:text-[#E8C547] hover:translate-x-1 ${
            pathname === '/dashboard/parametres'
              ? 'bg-[rgba(232,197,71,0.1)] text-[#E8C547] shadow-[inset_3px_0_0_#E8C547]'
              : 'text-[#7A7870]'
          }`}
        >
          <span className="text-base transition-transform duration-200 group-hover:scale-125">⚙️</span>
          Paramètres
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1E1E1C] flex flex-col gap-2">
        <div className="bg-[rgba(232,197,71,0.04)] border border-[#1E1E1C] rounded-lg px-3 py-2 text-xs text-[#7A7870] truncate">
          {email}
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full text-left text-xs text-[#7A7870] px-3 py-2 rounded-lg transition-all duration-200 hover:text-[#E8C547] hover:bg-[rgba(232,197,71,0.08)]"
          >
            ← Déconnexion
          </button>
        </form>
      </div>
    </aside>
  )
}
