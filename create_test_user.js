const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
    const email = 'expiry_test@example.com';
    const password = 'password123';

    // Delete if exists
    // We can't easily delete with admin API without ID, so just try create.

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Expiry Test User' }
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created:', data.user.id);

        // Give them a plan (Premium)
        // First find plan
        const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'professional').single();

        // Create active subscription
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await supabase.from('subscriptions').insert({
            user_id: data.user.id,
            plan_id: plan.id,
            status: 'active',
            scans_used: 0,
            current_period_start: now.toISOString(),
            current_period_end: expiresAt.toISOString()
        });

        console.log('Subscription created.');
    }
}

createTestUser();
