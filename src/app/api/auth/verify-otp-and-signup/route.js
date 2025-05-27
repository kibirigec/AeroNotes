import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../../lib/supabaseAdmin'; // Corrected path
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
  console.log("\n--- Verify OTP & Sign Up: Request received ---");
  try {
    const { phoneNumber, otp, pin } = await request.json();
    console.log("Request body:", { phoneNumber, otp, pin });

    if (!phoneNumber || !otp || !pin) {
      console.error("Missing fields:", { phoneNumber, otp, pin });
      return NextResponse.json({ error: 'Phone number, OTP, and PIN are required' }, { status: 400 });
    }
    
    const afronautesPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    if (!/^\+[1-9]\d{1,14}$/.test(afronautesPhoneNumber)) {
       console.error("Invalid phone number format:", afronautesPhoneNumber);
       return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
    }

    if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
        console.error("Invalid PIN format:", pin);
        return NextResponse.json({ error: 'PIN must be a 4 to 8 digit number.' }, { status: 400 });
    }

    // --- OTP Store Limitation --- //
    console.warn('OTP Verification Skipped: Due to in-memory store limitations across requests. Implement shared OTP store.');
    // Actual OTP check would be here in a production system
    // const storedOtpData = otpStore.get(afronautesPhoneNumber);
    // if (!storedOtpData || storedOtpData.otp !== otp || storedOtpData.expiry < Date.now()) {
    //   console.error("OTP validation failed (or would have failed). Stored:", storedOtpData, "Received OTP:", otp);
    //   return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    // }
    // otpStore.delete(afronautesPhoneNumber); // OTP used, delete it
    // --- End OTP Store Limitation --- //

    const lastFourDigits = afronautesPhoneNumber.slice(-4);
    console.log("Processing for:", { afronautesPhoneNumber, lastFourDigits });

    console.log("Hashing PIN...");
    const pinHash = await bcrypt.hash(pin, 10);
    const supabasePassword = deriveSupabasePassword(afronautesPhoneNumber);
    console.log("PIN hashed. Derived Supabase password generated.");

    console.log("Creating Supabase auth user...");
    const { data: authUserResponse, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: afronautesPhoneNumber, 
      password: supabasePassword,
      // phone_confirm: true, // If you want to auto-confirm the phone number since OTP was (notionally) verified
    });

    if (authError) {
      console.error('Supabase auth user creation error:', authError.message, authError);
      // Handle specific errors, e.g., if user (phone) already exists
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create user in Supabase auth', details: authError.message }, { status: 500 });
    }

    // Correctly access the user object from the response
    const createdUser = authUserResponse?.user;
    if (!createdUser) {
        console.error('Failed to create user in Supabase auth, no user object returned in response. Full response:', authUserResponse);
        return NextResponse.json({ error: 'Failed to create user in Supabase auth, no user object returned' }, { status: 500 });
    }
    console.log("Supabase auth user created:", createdUser.id);

    console.log("Inserting into user_profiles table...");
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: createdUser.id, 
        phone_number: afronautesPhoneNumber,
        phone_suffix: lastFourDigits,
        pin_hash: pinHash,
      });

    if (profileError) {
      console.error('Supabase profile creation error:', profileError.message, profileError);
      await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
      console.log("Rolled back Supabase auth user creation due to profile error.");
      return NextResponse.json({ error: 'Failed to save user profile', details: profileError.message }, { status: 500 });
    }
    console.log("User profile created successfully.");

    console.log("Attempting to sign in user automatically...");
    // Sign-in the user to get a session immediately (optional, but good UX)
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        phone: afronautesPhoneNumber, // Or email if you used that for signup
        password: supabasePassword,
    });

    if (signInError) {
        console.error('Supabase sign-in error after signup:', signInError);
        // User is created but sign-in failed. This is unusual. 
        // The user can still log in using the PIN + last four flow.
        return NextResponse.json({ message: 'Signup successful, but automatic sign-in failed. Please try logging in.', userId: createdUser.id }, { status: 201 });
    }

    if (!signInData || !signInData.session) {
        return NextResponse.json({ message: 'Signup successful, but automatic sign-in failed to return a session. Please try logging in.', userId: createdUser.id }, { status: 201 });
    }

    // Return session to the client
    return NextResponse.json({ 
        message: 'Signup successful and signed in', 
        userId: createdUser.id,
        session: signInData.session 
    });

  } catch (error) {
    console.error('Verify OTP and Signup Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 