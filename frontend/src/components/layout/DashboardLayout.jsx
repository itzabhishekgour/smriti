import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import GlobalAiSearch from './GlobalAiSearch'

export default function DashboardLayout() {
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsAiSearchOpen(true)
    document.addEventListener('open-ai-search', handleOpen)
    return () => document.removeEventListener('open-ai-search', handleOpen)
  }, [])

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <Sidebar onOpenAiSearch={() => setIsAiSearchOpen(true)} />

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col w-full">
        <div className="flex-1 w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile nav */}
      <MobileNav onOpenAiSearch={() => setIsAiSearchOpen(true)} />

      <GlobalAiSearch isOpen={isAiSearchOpen} onClose={() => setIsAiSearchOpen(false)} />
    </div>
  )
}
