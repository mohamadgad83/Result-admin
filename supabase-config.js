import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://duxqpoooowiqzcedmmoh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHFwb29vd2l3cXpjZWRtbW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5MjY0NTYsImV4cCI6MjA2MTUwMjQ1Nn0.K1TVi7W2XwHmL5jBfXtqOsWnObe5JqMNvj-3fUpYSoA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
