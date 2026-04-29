import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch } from './api'

function toTag(t) {
  return { id: String(t.id), name: t.name, color: t.color }
}

function toEvent(l) {
  return {
    id: String(l.id),
    title: l.title,
    start: new Date(l.start_time),
    end: new Date(l.end_time),
    tagId: String(l.tag_id),
    notes: l.notes ?? '',
  }
}

export const useStore = create(
  persist(
    (set, get) => ({
      hydrated: false,
      user: null,
      tags: [],
      events: [],

      init: async () => {
        if (get().hydrated) return
        try {
          const [tags, logs] = await Promise.all([
            apiFetch('/tags'),
            apiFetch('/logs'),
          ])
          set({ hydrated: true, tags: tags.map(toTag), events: logs.map(toEvent) })
        } catch {
          set({ hydrated: true, user: null, tags: [], events: [] })
        }
      },

      login: async ({ email, password }) => {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        set({ user: { name: data.name, email } })
      },

      signup: async ({ name, email, password }) => {
        await apiFetch('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        })
        set({ user: { name, email } })
      },

      logout: async () => {
        await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
        set({ user: null, tags: [], events: [], hydrated: false })
      },

      addTag: async (t) => {
        const data = await apiFetch('/tags', {
          method: 'POST',
          body: JSON.stringify(t),
        })
        const tag = toTag(data)
        set((s) => ({ tags: [...s.tags, tag] }))
        return tag
      },

      deleteTag: async (id) => {
        await apiFetch(`/tags/${id}`, { method: 'DELETE' })
        set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }))
      },

      addEvent: async (e) => {
        const data = await apiFetch('/logs', {
          method: 'POST',
          body: JSON.stringify({
            title: e.title,
            start_time: e.start.toISOString(),
            end_time: e.end.toISOString(),
            tag_id: Number(e.tagId),
            notes: e.notes ?? null,
          }),
        })
        const ev = toEvent(data)
        set((s) => ({ events: [...s.events, ev] }))
        return ev
      },

      updateEvent: async (e) => {
        const data = await apiFetch(`/logs/${e.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: e.title,
            start_time: e.start.toISOString(),
            end_time: e.end.toISOString(),
            tag_id: Number(e.tagId),
            notes: e.notes ?? null,
          }),
        })
        const updated = toEvent(data)
        set((s) => ({ events: s.events.map((x) => (x.id === e.id ? updated : x)) }))
      },

      deleteEvent: async (id) => {
        await apiFetch(`/logs/${id}`, { method: 'DELETE' })
        set((s) => ({ events: s.events.filter((x) => x.id !== id) }))
      },

      fetchSummary: async (from, to) => {
        const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })
        return apiFetch(`/summary?${params}`)
      },
    }),
    {
      name: 'timelog-user',
      partialize: (s) => ({ user: s.user }),
    }
  )
)
