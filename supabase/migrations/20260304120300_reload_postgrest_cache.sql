-- Notify PostgREST to reload its schema cache after permission changes
NOTIFY pgrst, 'reload schema';
