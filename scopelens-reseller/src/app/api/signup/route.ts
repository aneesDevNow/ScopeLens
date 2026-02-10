import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to update profile after signup
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email, password, companyName, country } = await request.json();

        if (!email || !password || !companyName) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        // Create user via admin API (auto-confirms email)
        const { data: userData, error: signupError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                company_name: companyName,
                role: "reseller",
                country: country || null,
            },
        });

        if (signupError) {
            return NextResponse.json({ error: signupError.message }, { status: 400 });
        }

        if (!userData.user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        // Update or insert the profile to ensure role is set
        // (Using upsert to handle race condition where trigger hasn't created profile yet)
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: userData.user.id,
                email,
                first_name: companyName,
                role: "reseller",
                country: country || null,
            }, { onConflict: "id" });

        if (profileError) {
            console.error("Failed to update profile role:", profileError);
            // Don't fail the signup — the user was created, role can be fixed later
        }

        // Generate a random referral code
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        // Also create a row in the resellers table if it exists
        const { error: resellerError } = await supabaseAdmin
            .from("resellers")
            .insert({
                user_id: userData.user.id,
                company_name: companyName,
                referral_code: referralCode,
                credit_balance: 0,
            });

        if (resellerError) {
            console.error("Failed to create reseller record:", resellerError);
            // Non-fatal — the reseller row can be created later
        }

        return NextResponse.json({
            success: true,
            message: "Account created successfully. You can now sign in.",
        });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
