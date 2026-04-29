import { useNavigate, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { CalendarRange, BarChart3, Plus, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { TagModal } from '@/components/tag-modal'

export function AppSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useStore((s) => s.user)
  const tags = useStore((s) => s.tags)
  const events = useStore((s) => s.events)
  const logout = useStore((s) => s.logout)
  const [tagOpen, setTagOpen] = useState(false)

  const eventCountByTag = useMemo(() => {
    const c = {}
    events.forEach((ev) => {
      c[ev.tagId] = (c[ev.tagId] || 0) + 1
    })
    return c
  }, [events])

  const initials = (user?.name || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CalendarRange className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Tagtrack</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === '/dashboard'}
                    onClick={() => navigate('/dashboard')}
                  >
                    <CalendarRange />
                    Calendar
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === '/summaries'}
                    onClick={() => navigate('/summaries')}
                  >
                    <BarChart3 />
                    Summaries
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Tags</SidebarGroupLabel>
            <SidebarGroupAction title="Add tag" onClick={() => setTagOpen(true)}>
              <Plus />
              <span className="sr-only">Add tag</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {tags.map((tag) => (
                  <SidebarMenuItem key={tag.id}>
                    <SidebarMenuButton className="cursor-default">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="truncate">{tag.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{eventCountByTag[tag.id] || 0}</SidebarMenuBadge>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user?.name || '—'}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email || ''}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>

      <TagModal open={tagOpen} onOpenChange={setTagOpen} />
    </>
  )
}
