import { create } from 'zustand'
import axios from 'axios'
import { API } from '../constants'

// ids of the signed-in user's favourite books, shared by every heart button
const useFavouritesStore = create((set, get) => ({
  ids: [],

  load: async (token) => {
    try {
      const { data } = await axios.get(`${API}/user/favourites`, { headers: { Authorization: `Bearer ${token}` } })
      set({ ids: data.filter(f => f.book).map(f => f.book._id) })
    } catch { /* hearts just start empty */ }
  },

  clear: () => set({ ids: [] }),

  // optimistic toggle; rolls back if the server refuses. Returns the new state or null on failure.
  toggle: async (bookId, token) => {
    const before = get().ids
    const adding = !before.includes(bookId)
    set({ ids: adding ? [...before, bookId] : before.filter(id => id !== bookId) })
    try {
      const { data } = await axios.post(`${API}/user/favourites/${bookId}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      return data.favourited
    } catch {
      set({ ids: before })
      return null
    }
  },
}))

export default useFavouritesStore
