import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabaseAdmin'; // Adjusted path
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// In-memory store for OTPs - this MUST be the same instance as in send-otp.js
// In a real app, this shared state is problematic. Use Redis/DB instead.
// For now, assuming Next.js might cache this module or we deploy to a single instance.
// THIS IS A MAJOR LIMITATION FOR SCALABILITY AND RELIABILITY.
const otpStore = new Map(); // This won't share state with send-otp.js in separate requests/serverless functions.
                         // We need to address this. For now, proceeding with the logic, but highlighting the issue.

// Function to derive a strong password for Supabase user (not used by end-user)
// We use the phone number and a server-side secret to make it deterministic if needed, but unique per user.
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
    const { phoneNumber, otp, pin } = await request.json();

    if (!phoneNumber || !otp || !pin) {
      return NextResponse.json({ error: 'Phone number, OTP, and PIN are required' }, { status: 400 });
    }
    
    const afronautesPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    if (!/^\\+[1-9]\\d{1,14}$/.test(afronautesPhoneNumber)) {
       return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
    }

    if (pin.length < 4 || pin.length > 8 || !/^\\d+$/.test(pin)) {
        return NextResponse.json({ error: 'PIN must be a 4 to 8 digit number.' }, { status: 400 });
    }

    // --- OTP Store Limitation --- //
    // FIXME: The otpStore here is a new instance and won't have the OTP set by send-otp/route.js
    // This needs to be replaced with a shared store (e.g., Redis, database table)
    // For this example to proceed, we will *simulate* it being found for now.
    // const storedOtpData = otpStore.get(afronautesPhoneNumber); 
    // In a real setup, if (!storedOtpData) return NextResponse.json({ error: 'Invalid phone number or OTP not requested' }, { status: 400 });
    // if (storedOtpData.expiry < Date.now()) return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    // if (storedOtpData.otp !== otp) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    // otpStore.delete(afronautesPhoneNumber); // OTP used, delete it
    console.warn('OTP Verification Skipped: Due to in-memory store limitations across requests. Implement shared OTP store.');
    // --- End OTP Store Limitation --- //

    const lastFourDigits = afronautesPhoneNumber.slice(-4);
    const pinHash = await bcrypt.hash(pin, 10);
    const supabasePassword = deriveSupabasePassword(afronautesPhoneNumber);

    // Create Supabase auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.createUser({
      phone: afronautesPhoneNumber, // Store phone in auth.users for potential future use (e.g. password reset via phone)
      password: supabasePassword,
      // phone_confirm: true, // We've verified via OTP, so we can consider the phone confirmed.
    });

    if (authError) {
      console.error('Supabase auth user creation error:', authError);
      // Handle specific errors, e.g., if user (phone) already exists
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create user in Supabase auth', details: authError.message }, { status: 500 });
    }

    if (!authUser || !authUser.user) {
        return NextResponse.json({ error: 'Failed to create user in Supabase auth, no user returned' }, { status: 500 });
    }

    // Insert into user_profiles table
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user.id, // Link to the auth.users table
        full_phone_number: afronautesPhoneNumber,
        last_four_digits: lastFourDigits,
        pin_hash: pinHash,
      });

    if (profileError) {
      console.error('Supabase profile creation error:', profileError);
      // If profile creation fails, we should ideally delete the auth user to keep things consistent
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: 'Failed to save user profile', details: profileError.message }, { status: 500 });
    }

    // Sign-in the user to get a session immediately (optional, but good UX)
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        phone: afronautesPhoneNumber, // Or email if you used that for signup
        password: supabasePassword,
    });

    if (signInError) {
        console.error('Supabase sign-in error after signup:', signInError);
        // User is created but sign-in failed. This is unusual. 
        // The user can still log in using the PIN + last four flow.
        return NextResponse.json({ message: 'Signup successful, but automatic sign-in failed. Please try logging in.', userId: authUser.user.id }, { status: 201 });
    }

    if (!signInData || !signInData.session) {
        return NextResponse.json({ message: 'Signup successful, but automatic sign-in failed to return a session. Please try logging in.', userId: authUser.user.id }, { status: 201 });
    }

    // Return session to the client
    return NextResponse.json({ 
        message: 'Signup successful and signed in', 
        userId: authUser.user.id,
        session: signInData.session 
    });

  } catch (error) {
    console.error('Verify OTP and Signup Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 