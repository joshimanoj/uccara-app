/**
 * Supabase client for Uccara mobile app
 * Configured for React Native with AsyncStorage for session persistence
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET');
console.log('Supabase Key:', supabaseAnonKey ? 'SET (length: ' + supabaseAnonKey.length + ')' : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Database types (can be generated from Supabase later)
export interface Mantra {
  id: number;
  slug: string;
  title_primary: string;
  title_alternatives?: string;
  deity: string[];
  source_reference?: string;
  intro_lines_devanagari?: string;
  intro_lines_transliteration?: string;
  significance?: string;
  benefits_traditional?: string;
  when_to_recite?: {
    time?: string;
    occasions?: string[];
    frequency?: string;
  };
  how_to_chant?: {
    posture?: string;
    focus?: string;
    notes?: string;
  };
  tags?: string[];
  audio_url?: string;
  created_at?: string;
}

export interface Line {
  id: number;
  mantra_id: number;
  line_number: number;
  line_text: string;
  audio_url?: string;
  line_meaning?: string;
}

export interface Term {
  id: number;
  line_id: number;
  term_number: number;
  hindi_term: string;
  english_term_iast: string;
  pronunciation?: string;
}

export interface Word {
  id: number;
  term_id: number;
  word_iast: string;
  root?: string;
  etymology?: string;
  meaning: string;
  word_number: number;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  mantra_id: number;
  created_at: string;
}

export interface MantraCollection {
  id: number;
  name: string;
  created_at: string;
}

export interface DeityMapping {
  id: number;
  primary_name: string;
  secondary_name: string;
  created_at: string;
}

export interface MantraWithDetails extends Mantra {
  lines?: (Line & {
    terms?: (Term & {
      words?: Word[];
    })[];
  })[];
}
