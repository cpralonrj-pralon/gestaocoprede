// Export Supabase client and types
export * from './client';

// Export service functions
export * from './employees';
export * from './hierarchy';
export * from './hoursBank';
export * from './feedback';
export * from './certificates';
export * from './schedules';

// Re-export supabase client for direct access
export { supabase } from './client';
