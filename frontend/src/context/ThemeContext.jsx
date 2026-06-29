import { createContext, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'

export const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => null,
})

export function ThemeProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [theme, setThemeState] = useState(() => {
    // 1. Try to get theme from localStorage
    const saved = localStorage.getItem('smriti_theme')
    return saved || 'system'
  })

  // Whenever user logs in, if they have a saved theme from backend, use it
  useEffect(() => {
    if (isAuthenticated && user?.theme) {
      setThemeState(user.theme)
      localStorage.setItem('smriti_theme', user.theme)
    }
  }, [isAuthenticated, user?.theme])

  // Core logic to apply 'dark' class
  useEffect(() => {
    const root = window.document.documentElement
    
    const applyTheme = (currentTheme) => {
      root.classList.remove('light', 'dark')
      
      if (currentTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(currentTheme)
      }
    }

    applyTheme(theme)

    // Listen for OS changes if in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const setTheme = async (newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('smriti_theme', newTheme)
    
    // Save to backend if logged in
    if (isAuthenticated) {
      try {
        await authService.updateTheme(newTheme)
      } catch (err) {
        console.error('Failed to save theme to backend', err)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
