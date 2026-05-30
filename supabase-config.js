import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://onrnecgazlrdzdywauev.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucm5lY2dhemxyZHpkeXdhdWV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA3NjMyMSwiZXhwIjoyMDk1NjUyMzIxfQ.Pm0nFoMUqQ1eM3tjOiQSodaMgIYNoc1ouW1JnDMLJSE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
