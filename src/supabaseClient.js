import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coxkznpuqtuweijetdja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveGt6bnB1cXR1d2VpamV0ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjAxMzEsImV4cCI6MjA5MzM5NjEzMX0.D_3BZhlNT6oaZKFOsSr8b1u55aTsGflCrqXmbMQx5ZU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);