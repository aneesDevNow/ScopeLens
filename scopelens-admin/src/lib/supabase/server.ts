import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
    encryptCookieValue,
    decryptCookieValue,
    toCustomCookieName,
    toSupabaseCookieName,
    getProjectRef
} from "@/lib/cookie-crypto";

export async function createClient() {
    const cookieStore = await cookies();
    const projectRef = getProjectRef();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    // Read encrypted cookies, decrypt and remap names back to Supabase format
                    return cookieStore.getAll().map(cookie => ({
                        name: toSupabaseCookieName(cookie.name, projectRef),
                        value: decryptCookieValue(cookie.value),
                    }));
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            const customName = toCustomCookieName(name);
                            const encryptedValue = encryptCookieValue(value);
                            cookieStore.set(customName, encryptedValue, {
                                ...options,
                                httpOnly: true,
                                secure: process.env.NODE_ENV === 'production',
                                sameSite: 'lax',
                            });
                        });
                    } catch {
                        // The `setAll` method was called from a Server Component.
                    }
                },
            },
        }
    );
}
