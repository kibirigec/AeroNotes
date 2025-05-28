#!/usr/bin/env node

/**
 * Test script to verify real-time deletion synchronization
 * Run this to test if deletions are properly synced across devices
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🧪 Testing real-time deletion sync...');
console.log('📡 Connecting to Supabase realtime...');

// Create a test channel to listen for deletion events
const channel = supabase.channel('deletion-test')
  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'files'
    },
    (payload) => {
      console.log('🗑️  File deletion detected:', {
        id: payload.old.id,
        name: payload.old.name,
        type: payload.old.type,
        user_id: payload.old.user_id,
        bucket_id: payload.old.bucket_id
      });
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'notes'
    },
    (payload) => {
      console.log('📝 Note deletion detected:', {
        id: payload.old.id,
        title: payload.old.title?.substring(0, 50) + '...',
        user_id: payload.old.user_id
      });
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Successfully subscribed to deletion events');
      console.log('💡 Try deleting a file or note from another device/browser tab');
      console.log('   You should see the deletion events logged here');
      console.log('⏱️  Listening for 60 seconds...');
      
      // Auto-disconnect after 60 seconds
      setTimeout(() => {
        console.log('⏰ Test completed - disconnecting...');
        supabase.removeChannel(channel);
        process.exit(0);
      }, 60000);
    } else {
      console.error('❌ Failed to subscribe:', status);
      process.exit(1);
    }
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test...');
  supabase.removeChannel(channel);
  process.exit(0);
}); 