import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ysrhvnlyiqzachpbagnk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzcmh2bmx5aXF6YWNocGJhZ25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzAxNDcsImV4cCI6MjA3MTkwNjE0N30.b4XhaA_XlrfZIlReGAmGDUr436pz31RALpvvQ9Te16M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types that match our schema
export interface Database {
  public: {
    Tables: {
      ingredient_canonical: {
        Row: {
          id: string
          name: string
          synonyms: string[]
          category: 'protein' | 'vegetable' | 'grain' | 'oil' | 'dairy' | 'fruit' | 'spice' | 'other'
          default_unit: string
          density: number | null
          shelf_life_defaults: {
            room: number
            fridge: number
            freezer: number
          }
          nutrition_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          synonyms?: string[]
          category: 'protein' | 'vegetable' | 'grain' | 'oil' | 'dairy' | 'fruit' | 'spice' | 'other'
          default_unit: string
          density?: number | null
          shelf_life_defaults?: {
            room: number
            fridge: number
            freezer: number
          }
          nutrition_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          synonyms?: string[]
          category?: 'protein' | 'vegetable' | 'grain' | 'oil' | 'dairy' | 'fruit' | 'spice' | 'other'
          default_unit?: string
          density?: number | null
          shelf_life_defaults?: {
            room: number
            fridge: number
            freezer: number
          }
          nutrition_ref?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          auth_provider: string | null
          preferences: {
            units: 'metric' | 'imperial'
            diet: string[]
            cuisines: string[]
            allergens: string[]
            equipment: string[]
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          auth_provider?: string | null
          preferences?: {
            units: 'metric' | 'imperial'
            diet: string[]
            cuisines: string[]
            allergens: string[]
            equipment: string[]
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          auth_provider?: string | null
          preferences?: {
            units: 'metric' | 'imperial'
            diet: string[]
            cuisines: string[]
            allergens: string[]
            equipment: string[]
          }
          created_at?: string
          updated_at?: string
        }
      }
      pantry_items: {
        Row: {
          id: string
          user_id: string
          ingredient_canonical_id: string
          quantity: number
          unit: string
          storage: 'room' | 'fridge' | 'freezer'
          expiry_at: string | null
          source: 'receipt' | 'manual'
          notes: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ingredient_canonical_id: string
          quantity: number
          unit: string
          storage: 'room' | 'fridge' | 'freezer'
          expiry_at?: string | null
          source: 'receipt' | 'manual'
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ingredient_canonical_id?: string
          quantity?: number
          unit?: string
          storage?: 'room' | 'fridge' | 'freezer'
          expiry_at?: string | null
          source?: 'receipt' | 'manual'
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          title: string
          cuisine: string
          steps: string[]
          yields: number
          time: number
          difficulty: 'Easy' | 'Medium' | 'Hard'
          image_url: string | null
          url: string | null
          author: string | null
          nutrition: {
            calories: number
            protein: number
            fat: number
            carbs: number
          }
          source: 'imported' | 'user' | 'community'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          cuisine: string
          steps: string[]
          yields: number
          time: number
          difficulty: 'Easy' | 'Medium' | 'Hard'
          image_url?: string | null
          url?: string | null
          author?: string | null
          nutrition?: {
            calories: number
            protein: number
            fat: number
            carbs: number
          }
          source: 'imported' | 'user' | 'community'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          cuisine?: string
          steps?: string[]
          yields?: number
          time?: number
          difficulty?: 'Easy' | 'Medium' | 'Hard'
          image_url?: string | null
          url?: string | null
          author?: string | null
          nutrition?: {
            calories: number
            protein: number
            fat: number
            carbs: number
          }
          source?: 'imported' | 'user' | 'community'
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_canonical_id: string
          quantity: number
          unit: string
          optional: boolean
          substitutions: string[]
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_canonical_id: string
          quantity: number
          unit: string
          optional?: boolean
          substitutions?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_canonical_id?: string
          quantity?: number
          unit?: string
          optional?: boolean
          substitutions?: string[]
          created_at?: string
        }
      }
    }
  }
}
