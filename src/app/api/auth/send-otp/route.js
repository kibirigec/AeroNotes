import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Twilio environment variables are not set.');
  // In a real app, you might want to prevent startup or handle this more gracefully
}

const client = twilio(accountSid, authToken);

// In-memory store for OTPs (for demonstration purposes)
// In a production app, use Redis or a database for this
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

export async function POST(request) {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    return NextResponse.json({ error: 'Twilio service not configured.' }, { status: 500 });
  }
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Basic phone number validation (you might want a more robust library for this)
    const afronautesPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    if (!/^\\+[1-9]\\d{1,14}$/.test(afronautesPhoneNumber)) {
       return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
    }


    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // Store OTP with phone number and expiry
    otpStore.set(afronautesPhoneNumber, { otp, expiry });

    await client.messages.create({
      body: `Your AeroNotes verification code is: ${otp}`,
      from: twilioPhoneNumber,
      to: afronautesPhoneNumber,
    });

    console.log(`OTP for ${afronautesPhoneNumber}: ${otp}`); // For debugging, remove in prod

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    // Check for Twilio-specific errors
    if (error.code === 21211) { // Invalid 'To' Phone Number
        return NextResponse.json({ error: 'The provided phone number is invalid or not verifiable by Twilio.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send OTP', details: error.message }, { status: 500 });
  }
} 