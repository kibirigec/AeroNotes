/**
 * Update Test User PIN
 * Updates the admin user's PIN from '1234' to '5678'
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateUserPin() {
  console.log('🔄 Updating test user PIN...');

  try {
    // Update the admin user's PIN hash
    const { data, error } = await supabase
      .from('users')
      .update({ 
        pin_hash: '$2b$12$fVAMweAZlgBElAtqyQB/suWcALn52vdPgTqdDE7YP9lqAze5JfaOi' // hash for '5678'
      })
      .eq('phone_number', '+1234567890')
      .select();

    if (error) {
      console.error('❌ Error updating user PIN:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully updated user PIN to 5678');
      console.log('📊 Updated user:', data[0]);
    } else {
      console.log('❌ No user found with phone number +1234567890');
    }

  } catch (error) {
    console.error('❌ Update failed:', error.message);
  }
}

// Run the update
updateUserPin().catch(console.error); 