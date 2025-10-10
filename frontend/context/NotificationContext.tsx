"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import * as Notifications from "expo-notifications"

interface NotificationContextType {
  scheduleNotification: (title: string, body: string, seconds: number) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerForPushNotifications()
  }, [])

  const registerForPushNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== "granted") {
      console.log("Notification permissions not granted")
    }
  }

  const scheduleNotification = async (title: string, body: string, seconds: number) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { seconds },
    })
  }

  return <NotificationContext.Provider value={{ scheduleNotification }}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotifications must be used within NotificationProvider")
  return context
}
