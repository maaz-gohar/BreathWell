"use client"

import { createContext, useContext, type ReactNode } from "react"

interface ThemeContextType {
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = {
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      background: "#f9fafb",
      text: "#1f2937",
    },
  }

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
