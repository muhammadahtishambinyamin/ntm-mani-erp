import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cjbzibrqtlohtxdwrvam.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYnppYnJxdGxvaHR4ZHdydmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDQxNjgsImV4cCI6MjA4NTI4MDE2OH0.6yQKyN-MYmr0JlrTHigCvtHziZI8tMbeaUnzx9ZFJzo'

export const supabase = createClient(supabaseUrl, supabaseKey)
