import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Storage helpers for liked projects
export async function saveLikedProjects(userId, projects) {
  const { data, error } = await supabase
    .from('user_data')
    .upsert({
      user_id: userId,
      liked_projects: projects,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  return { data, error }
}

export async function loadLikedProjects(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('liked_projects')
    .eq('user_id', userId)
    .single()
  return { data: data?.liked_projects || [], error }
}

// Storage helpers for history
export async function saveHistory(userId, history) {
  const { data, error } = await supabase
    .from('user_data')
    .upsert({
      user_id: userId,
      history: history,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  return { data, error }
}

export async function loadHistory(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('history')
    .eq('user_id', userId)
    .single()
  return { data: data?.history || [], error }
}

// Combined save/load for all user data
export async function saveUserData(userId, { likedProjects, history, currentIndex, passedProjects, userEmail }) {
  const { data, error } = await supabase
    .from('user_data')
    .upsert({
      user_id: userId,
      user_email: userEmail,
      liked_projects: likedProjects,
      history: history,
      current_index: currentIndex,
      passed_projects: passedProjects,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  return { data, error }
}

export async function loadUserData(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // No data found, return defaults
    return {
      data: {
        liked_projects: [],
        history: [],
        current_index: 0,
        passed_projects: []
      },
      error: null
    }
  }

  return { data, error }
}
