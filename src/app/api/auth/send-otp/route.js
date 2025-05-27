import { NextResponse } from 'next/server';
// Removed: import twilio from 'twilio';

// Infobip Configuration (still read for completeness, but API call will be disabled)
const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;
const INFOBIP_2FA_APPLICATION_ID = process.env.INFOBIP_2FA_APPLICATION_ID;
const INFOBIP_2FA_MESSAGE_ID = process.env.INFOBIP_2FA_MESSAGE_ID;

// In-memory store for OTPs (for demonstration purposes)
// In a production app, use Redis or a database for this
const otpStore = new Map();

function generateOTP() {
  // Generate a 4-digit OTP to match Infobip message template pinLength
  return Math.floor(1000 + Math.random() * 9000).toString(); 
}

export async function POST(request) {
  // Temporarily disable actual Infobip API call for testing
  const MOCK_OTP_SENDING = true; 

  if (!MOCK_OTP_SENDING && (!INFOBIP_BASE_URL || !INFOBIP_API_KEY || !INFOBIP_2FA_APPLICATION_ID || !INFOBIP_2FA_MESSAGE_ID)) {
    console.error('Infobip environment variables are not fully set for actual sending.');
    return NextResponse.json({ error: 'Infobip SMS service not configured properly.' }, { status: 500 });
  }

  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const validatedPhoneNumberE164 = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    if (!/^\+[1-9]\d{1,14}$/.test(validatedPhoneNumberE164)) {
       return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
    }

    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000; 
    otpStore.set(validatedPhoneNumberE164, { otp, expiry });
    console.log(`Mock OTP for ${validatedPhoneNumberE164}: ${otp} (Not sent via Infobip)`);

    if (!MOCK_OTP_SENDING) {
      // --- Actual Infobip API Call (Currently Disabled) ---
      const normalizedPhoneNumberForInfobip = phoneNumber.replace(/^\+/, '');
      const infobipApiUrl = `${INFOBIP_BASE_URL}/2fa/2/pin`;
      const infobipHeaders = new Headers();
      infobipHeaders.append("Authorization", `App ${INFOBIP_API_KEY}`);
      infobipHeaders.append("Content-Type", "application/json");
      infobipHeaders.append("Accept", "application/json");
      const infobipBody = JSON.stringify({
        "applicationId": INFOBIP_2FA_APPLICATION_ID,
        "messageId": INFOBIP_2FA_MESSAGE_ID,
        "to": normalizedPhoneNumberForInfobip,
      });
      const infobipRequestOptions = {
          method: "POST",
          headers: infobipHeaders,
          body: infobipBody,
          redirect: "follow"
      };
      const infobipResponse = await fetch(infobipApiUrl, infobipRequestOptions);
      const infobipResultText = await infobipResponse.text();
      if (!infobipResponse.ok) {
          console.error('Infobip API Error (during attempted send):', infobipResponse.status, infobipResultText);
          let errorMessage = 'Failed to send OTP via Infobip.';
          try {
              const errorJson = JSON.parse(infobipResultText);
              errorMessage = errorJson?.requestError?.serviceException?.text || errorJson?.requestError?.serviceException?.messageId || errorMessage;
          } catch (e) { /* Ignore parsing error, use generic message */ }
          return NextResponse.json({ error: errorMessage, details: infobipResultText }, { status: infobipResponse.status });
      }
      console.log("Infobip Send PIN Response (actual send):", JSON.parse(infobipResultText));
      // --- End Actual Infobip API Call ---
    }

    return NextResponse.json({ message: 'OTP (mocked) sent successfully' });

  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json({ error: 'Internal server error while sending OTP', details: error.message }, { status: 500 });
  }
} 