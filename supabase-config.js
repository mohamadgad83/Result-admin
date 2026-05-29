import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://onrnecgazlrdzdywauev.supabase.co'
const supabaseAnonKey = 'sb_publishable_Rpw7pfPokf0BkEQQlkAFqA_QFnHKov4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
