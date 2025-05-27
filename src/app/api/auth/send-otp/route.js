import { NextResponse } from 'next/server';
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

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Normalize phone number to E.164 format
    const normalizedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Get OTP service instance
    const service = await getOTPServiceInstance();
    
    // Send OTP
    const result = await service.sendOTP(normalizedPhoneNumber, {
      length: 4,
      expiryMinutes: 10
    });

    if (!result.success) {
      console.error('Failed to send OTP:', result.error);
      return NextResponse.json({ 
        error: result.error || 'Failed to send OTP' 
      }, { status: 500 });
    }

    console.log(`✅ OTP sent successfully to ${normalizedPhoneNumber}`);
    
    return NextResponse.json({ 
      message: 'OTP sent successfully',
      provider: (await service.getStatus()).activeProvider
    });

  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json({ 
      error: 'Internal server error while sending OTP', 
      details: error.message 
    }, { status: 500 });
  }
} 