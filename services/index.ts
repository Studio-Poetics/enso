/**
 * STORAGE SERVICE CONFIGURATION
 *
 * This file controls which storage implementation to use.
 * Toggle between localStorage (development) and Supabase (production).
 */

// Import both implementations
import * as localStorageService from './storage';
import * as supabaseService from './supabase-storage';

// Configuration flag - set to true to use Supabase, false for localStorage
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

// Export the appropriate service based on configuration
export const authService = USE_SUPABASE ? supabaseService.authService : localStorageService.authService;
export const dbService = USE_SUPABASE ? supabaseService.dbService : localStorageService.dbService;

// Export configuration for debugging
export const isUsingSupabase = USE_SUPABASE;

// Re-export types for convenience
export type { User, Team, Project } from '../types';