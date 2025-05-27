import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../../lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OTPService } from '../../../../../lib/otp/OTPService.js';
import { getOTPConfig } from '../../../../../lib/otp/config.js';

// Initialize OTP service
let otpService = null;

async function getOTPServiceInstance() {
  if (!otpService) {
    otpService = OTPService.getInstance();
    const config = getOTPConfig();
    const initResult = await otpService.initialize(config);
    
    if (!initResult.success) {
      throw new Error(`Failed to initialize OTP service: ${initResult.error}`);
    }
  }
  return otpService;
}

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
    console.log("Request body:", { phoneNumber, otp: '***', pin: '***' });

    if (!phoneNumber || !otp || !pin) {
      console.error("Missing fields:", { phoneNumber: !!phoneNumber, otp: !!otp, pin: !!pin });
      return NextResponse.json({ error: 'Phone number, OTP, and PIN are required' }, { status: 400 });
    }
    
    const normalizedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    if (!/^\+[1-9]\d{1,14}$/.test(normalizedPhoneNumber)) {
       console.error("Invalid phone number format:", normalizedPhoneNumber);
       return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
    }

    if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
        console.error("Invalid PIN format");
        return NextResponse.json({ error: 'PIN must be a 4 to 8 digit number.' }, { status: 400 });
    }

    // Verify OTP using the new OTP service
    console.log("Verifying OTP...");
    const service = await getOTPServiceInstance();
    const otpResult = await service.verifyOTP(normalizedPhoneNumber, otp);
    
    if (!otpResult.success) {
      console.error("OTP verification failed:", otpResult.error);
      return NextResponse.json({ 
        error: otpResult.error || 'Invalid or expired OTP' 
      }, { status: 400 });
    }
    
    console.log("✅ OTP verified successfully");

    const lastFourDigits = normalizedPhoneNumber.slice(-4);
    console.log("Processing signup for:", normalizedPhoneNumber);

    console.log("Hashing PIN...");
    const pinHash = await bcrypt.hash(pin, 10);
    const supabasePassword = deriveSupabasePassword(normalizedPhoneNumber);
    console.log("PIN hashed. Derived Supabase password generated.");

    console.log("Creating Supabase auth user...");
    const { data: authUserResponse, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: normalizedPhoneNumber, 
      password: supabasePassword,
      phone_confirm: true, // Auto-confirm the phone number since OTP was verified
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

    // ---- BEGIN DIAGNOSTIC ----
    console.log(`[DIAGNOSTIC] Checking if user ${createdUser.id} exists in auth.users before profile insert...`);
    const { data: userCheck, error: userCheckError } = await supabaseAdmin
      .schema('auth')
      .from('users')
      .select('id')
      .eq('id', createdUser.id)
      .maybeSingle();

    if (userCheckError) {
      console.error('[DIAGNOSTIC] Error checking auth.users:', userCheckError.message);
    } else {
      console.log(`[DIAGNOSTIC] auth.users check for ${createdUser.id}:`, userCheck ? 'Found' : 'Not Found', userCheck);
    }

    console.log(`[DIAGNOSTIC] Checking if profile for user ${createdUser.id} exists in user_profiles before insert...`);
    const { data: profileCheck, error: profileCheckError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', createdUser.id)
      .maybeSingle();

    if (profileCheckError) {
      console.error('[DIAGNOSTIC] Error checking user_profiles:', profileCheckError.message);
    } else {
      console.log(`[DIAGNOSTIC] user_profiles check for ${createdUser.id}:`, profileCheck ? 'Found' : 'Not Found', profileCheck);
    }
    // ---- END DIAGNOSTIC ----

    console.log("Creating user profile...");
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: createdUser.id, 
        phone_number: normalizedPhoneNumber,
        phone_suffix: lastFourDigits,
        pin_hash: pinHash,
        is_pin_set: true,
      });

    if (profileError) {
      console.error('Supabase profile upsert error:', profileError.message, profileError);
      await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
      console.log("Rolled back Supabase auth user creation due to profile error.");
      return NextResponse.json({ error: 'Failed to save user profile', details: profileError.message }, { status: 500 });
    }
    console.log("User profile created successfully.");

    console.log("Attempting to sign in user automatically...");
    // Sign-in the user to get a session immediately (optional, but good UX)
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        phone: normalizedPhoneNumber,
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