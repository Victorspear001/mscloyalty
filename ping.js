// This script runs on GitHub servers to keep your DB alive
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Secrets!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function pingDatabase() {
  console.log("Pinging Supabase...");
  
  // Simple query to wake up the DB
  const { data, error } = await supabase.from('customers').select('count', { count: 'exact', head: true });

  if (error) {
    console.error("Ping Error:", error.message);
    process.exit(1);
  } else {
    console.log("Ping Successful! DB is awake.");
  }
}

pingDatabase();
