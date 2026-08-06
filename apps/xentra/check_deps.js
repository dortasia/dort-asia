const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pjeedikqcmznpwopfucs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZWVkaWtxY216bnB3b3BmdWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3MjkzMiwiZXhwIjoyMDk4NzQ4OTMyfQ._OaoKlAmrXM1taWBXfOWo_V1uQ1DqGpQ-_XMQqJ8AiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartments() {
  const { data, error } = await supabase.from('departments').select('*');
  console.log('Departments:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

checkDepartments();
