import { createClient } from '@supabase/supabase-js';

// O Vite usa import.meta.env para ler variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exportamos essa variável 'supabase' para usar no app todo
export const supabase = createClient(supabaseUrl, supabaseAnonKey);