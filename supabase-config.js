import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://onrnecgazlrdzdywauev.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucm5lY2dhemxyZHpkeXdhdWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzYzMjEsImV4cCI6MjA5NTY1MjMyMX0.klIbqyYBj3rsRJ5JgzCQyYfs60E_SydIZRi-BMsZE0U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
