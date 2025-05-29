
// Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://kpngseysyicyhsezucsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbmdzZXlzeWljeWhzZXp1Y3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MzAwNzYsImV4cCI6MjA2NDAwNjA3Nn0.WxIXf3I67IYtihZOoXSo_flmxCC5HKnLImIFayfjHf0';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Example: Fetch data from a table called "users"
async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users:', data);
  }
}

fetchUsers();
