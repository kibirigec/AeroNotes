import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../../lib/supabaseAdmin'; // Fixed path
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// IMPORTANT: Ensure APP_SECRET is set in your environment variables.
const appSecret = process.env.APP_SECRET || 'default-fallback-secret-CHANGE-ME';
if (appSecret === 'default-fallback-secret-CHANGE-ME') {
  console.warn('WARNING: APP_SECRET is not set or is using the default. Please set a strong, unique secret in your environment variables.');
}

function deriveSupabasePassword(phoneNumber) {
  return crypto.createHmac('sha256', appSecret)
    .update(phoneNumber)
    .digest('hex') + 'P!'; // Add complexity
}

export async function POST(request) {
  try {
    const { lastFourDigits, pin } = await request.json();

    if (!lastFourDigits || !pin) {
      return NextResponse.json({ error: 'Last four digits of phone and PIN are required' }, { status: 400 });
    }

    if (lastFourDigits.length !== 4 || !/^\d{4}$/.test(lastFourDigits)) {
        return NextResponse.json({ error: 'Invalid format for last four digits.' }, { status: 400 });
    }

    if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
        return NextResponse.json({ error: 'PIN must be a 4 to 8 digit number.' }, { status: 400 });
    }

    // Find user profiles matching the last four digits
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, phone_number, pin_hash')
      .eq('phone_suffix', lastFourDigits);

    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
      return NextResponse.json({ error: 'Error fetching user profiles', details: profileError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'Invalid login credentials (no profile found)' }, { status: 401 });
    }

    let authenticatedUser = null;
    let userFullPhoneNumber = null;

    for (const profile of profiles) {
      const pinMatch = await bcrypt.compare(pin, profile.pin_hash);
      if (pinMatch) {
        authenticatedUser = profile; // We found our user
        userFullPhoneNumber = profile.phone_number;
        break;
      }
    }

    if (!authenticatedUser || !userFullPhoneNumber) {
      return NextResponse.json({ error: 'Invalid login credentials (PIN mismatch)' }, { status: 401 });
    }

    // If PIN is correct, sign in with Supabase using the derived password
    const supabasePassword = deriveSupabasePassword(userFullPhoneNumber);
    
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      phone: userFullPhoneNumber, 
      password: supabasePassword,
    });

    if (signInError) {
      console.error('Supabase sign-in error:', signInError);
      return NextResponse.json({ error: 'Failed to sign in with Supabase', details: signInError.message }, { status: 500 });
    }
    
    if (!signInData || !signInData.session) {
        return NextResponse.json({ error: 'Sign in successful, but failed to return a session.'}, { status: 500 });
    }

    return NextResponse.json({ 
        message: 'Login successful', 
        userId: authenticatedUser.id,
        session: signInData.session 
    });

  } catch (error) {
    console.error('Login with PIN Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 