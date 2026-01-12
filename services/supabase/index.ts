// Export Supabase client and types
export * from './client';

// Export service functions
export * from './employees';
export * from './hierarchy';
export * from './hoursBank';

// Re-export supabase client for direct access
export { supabase } from './client';
