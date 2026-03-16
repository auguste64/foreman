import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', emoji: '🏠' },
    { href: '/dashboard/chantiers', label: 'Chantiers', emoji: '🏗️' },
    { href: '/dashboard/comptes-rendus', label: 'Comptes rendus', emoji: '📋' },
    { href: '/dashboard/artisans', label: 'Artisans', emoji: '👷' },
    { href: '/dashboard/planning', label: 'Planning', emoji: '📅' },
  ]

  return (
    <div className="flex h-screen bg-[#0D0D0B] overflow-hidden">
      <aside className="w-[240px] flex-shrink-0 flex flex-col h-full border-r border-[#1E1E1C] bg-[#0D0D0B]">
        <div className="p-6 border-b border-[#1E1E1C]">
          <Link href="/dashboard" className="text-[#E8C547] font-black text-xl tracking-widest hover:opacity-80 transition-opacity">FOREMAN</Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#7A7870] transition-all duration-200 hover:bg-[rgba(232,197,71,0.08)] hover:text-[#E8C547] hover:translate-x-1">
              <span className="text-base transition-transform duration-200 group-hover:scale-125">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
          <div className="border-t border-[#1E1E1C] my-2" />
          <Link href="/dashboard/parametres" className="group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#7A7870] transition-all duration-200 hover:bg-[rgba(232,197,71,0.08)] hover:text-[#E8C547] hover:translate-x-1">
            <span className="text-base transition-transform duration-200 group-hover:scale-125">⚙️</span>
            Paramètres
          </Link>
        </nav>
        <div className="p-4 border-t border-[#1E1E1C] flex flex-col gap-2">
          <div className="bg-[rgba(232,197,71,0.04)] border border-[#1E1E1C] rounded-lg px-3 py-2 text-xs text-[#7A7870] truncate">{user.email}</div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full text-left text-xs text-[#7A7870] px-3 py-2 rounded-lg transition-all duration-200 hover:text-[#E8C547] hover:bg-[rgba(232,197,71,0.08)]">← Déconnexion</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
