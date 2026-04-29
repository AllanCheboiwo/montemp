"use client";

import { create } from "zustand";
import { initialTags, buildInitialEvents } from "./dummy-data";
import type { EventItem, Tag, User } from "./types";

interface AppState {
  hydrated: boolean;
  user: User | null;
  tags: Tag[];
  events: EventItem[];

  hydrate: () => void;
  login: (creds: { name?: string; email: string }) => void;
  signup: (data: { name: string; email: string }) => void;
  logout: () => void;

  addTag: (tag: Omit<Tag, "id">) => Tag;
  addEvent: (e: Omit<EventItem, "id">) => EventItem;
  updateEvent: (e: EventItem) => void;
  deleteEvent: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  hydrated: false,
  user: null,
  tags: initialTags,
  events: [],

  hydrate: () =>
    set((s) => (s.hydrated ? s : { hydrated: true, events: buildInitialEvents() })),

  // login: call the API, then store the user
  login: async ({ email, password }) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    set({ user: { name: data.name, email } });
  },

  // signup: call the API
  signup: async ({ name, email, password }) => {
    await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    set({ user: { name, email } });
  },

// logout: clear cookie on backend, then clear state
  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    set({ user: null });
  },

  addTag: (t) => {
    const tag: Tag = { ...t, id: "t" + Date.now() };
    set((s) => ({ tags: [...s.tags, tag] }));
    return tag;
  },

  addEvent: (e) => {
    const ev: EventItem = { ...e, id: "e" + Date.now() };
    set((s) => ({ events: [...s.events, ev] }));
    return ev;
  },

  updateEvent: (e) =>
    set((s) => ({ events: s.events.map((x) => (x.id === e.id ? { ...x, ...e } : x)) })),

  deleteEvent: (id) =>
    set((s) => ({ events: s.events.filter((x) => x.id !== id) })),
}));
