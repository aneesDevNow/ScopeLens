import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const supabaseUrl = process.env.SUPABASE_URL!
    const params = req.nextUrl.searchParams.toString()

    try {
        const response = await fetch(`${supabaseUrl}/auth/v1/verify?${params}`, {
            redirect: 'manual',
        })

        const location = response.headers.get('location')
        if (location) {
            return NextResponse.redirect(location)
        }

        return NextResponse.redirect(new URL('/forgot-password', req.url))
    } catch (err) {
        console.error('Verify proxy error:', err)
        return NextResponse.redirect(new URL('/forgot-password', req.url))
    }
}
