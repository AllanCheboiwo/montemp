import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app-sidebar'
import { useStore } from '@/lib/store'

export default function AppLayout() {
  const navigate = useNavigate()
  const user = useStore((s) => s.user)
  const hydrated = useStore((s) => s.hydrated)
  const init = useStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (hydrated && !user) navigate('/login', { replace: true })
  }, [hydrated, user, navigate])

  if (!hydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-screen flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <span className="text-sm font-medium text-muted-foreground">Tagtrack</span>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
