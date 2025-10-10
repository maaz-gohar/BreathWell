export interface User {
  id: string
  name: string
  email: string
  password: string
  created_at: string
}

export interface MoodEntry {
  id: string
  user_id: string
  mood: "great" | "good" | "okay" | "bad" | "terrible"
  note?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  title: string
  description?: string
  frequency: "daily" | "weekly"
  completed: boolean
  streak: number
  created_at: string
}
