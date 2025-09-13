import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3004';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    // Return the response with the same status code
    return NextResponse.json(data, { 
      status: backendResponse.status 
    });

  } catch (error: any) {
    console.error('OTP verification API error:', error);
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 