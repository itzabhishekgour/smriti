import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col w-full">
        <div className="flex-1 w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile nav */}
      <MobileNav />
    </div>
  )
}
