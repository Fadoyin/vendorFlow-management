import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, DashboardStats, Notification, Forecast } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

interface DashboardState {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  setStats: (stats: DashboardStats) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  setUnreadCount: (count: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface ForecastState {
  forecasts: Forecast[]
  currentForecast: Forecast | null
  isLoading: boolean
  error: string | null
  setForecasts: (forecasts: Forecast[]) => void
  addForecast: (forecast: Forecast) => void
  updateForecast: (id: string, forecast: Partial<Forecast>) => void
  setCurrentForecast: (forecast: Forecast | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: (user: User, token: string) =>
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          }),
        logout: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user, token: state.token }),
      }
    )
  )
)

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      stats: null,
      isLoading: false,
      error: null,
      setStats: (stats: DashboardStats) => set({ stats, error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    })
  )
)

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      setNotifications: (notifications: Notification[]) =>
        set({ notifications, error: null }),
      addNotification: (notification: Notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        })),
      markAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === id ? { ...n, status: 'read' as any } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            status: 'read' as any,
          })),
          unreadCount: 0,
        })),
      setUnreadCount: (count: number) => set({ unreadCount: count }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    })
  )
)

export const useForecastStore = create<ForecastState>()(
  devtools(
    (set) => ({
      forecasts: [],
      currentForecast: null,
      isLoading: false,
      error: null,
      setForecasts: (forecasts: Forecast[]) =>
        set({ forecasts, error: null }),
      addForecast: (forecast: Forecast) =>
        set((state) => ({
          forecasts: [forecast, ...state.forecasts],
        })),
      updateForecast: (id: string, forecast: Partial<Forecast>) =>
        set((state) => ({
          forecasts: state.forecasts.map((f) =>
            f._id === id ? { ...f, ...forecast } : f
          ),
        })),
      setCurrentForecast: (forecast: Forecast | null) =>
        set({ currentForecast: forecast }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    })
  )
)

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: false,
        theme: 'light',
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setTheme: (theme: 'light' | 'dark') => set({ theme }),
        toggleTheme: () =>
          set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({ theme: state.theme }),
      }
    )
  )
)
