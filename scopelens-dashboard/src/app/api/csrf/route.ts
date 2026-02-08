import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';

/**
 * GET /api/csrf - Get a new CSRF token
 * Call this endpoint to get a token for forms test
 */
export async function GET() {
    try {
        const token = await generateCSRFToken();

        return NextResponse.json({
            csrfToken: token
        });
    } catch (error) {
        console.error('CSRF token generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate CSRF token' },
            { status: 500 }
        );
    }
}


