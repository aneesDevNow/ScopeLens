import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
    encryptCookieValue,
    decryptCookieValue,
    toCustomCookieName,
    toSupabaseCookieName,
    getProjectRef,
    splitCookieValue,
    reassembleChunkedCookies,
} from "@/lib/cookie-crypto";

export async function createClient() {
    const cookieStore = await cookies();
    const projectRef = getProjectRef();

    return createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    const raw = cookieStore.getAll().map(c => ({ name: c.name, value: c.value }));
                    // Reassemble chunks (sl_t.0 + sl_t.1 → sl_t) then decrypt & rename
                    const reassembled = reassembleChunkedCookies(raw);
                    return reassembled.map(cookie => ({
                        name: toSupabaseCookieName(cookie.name, projectRef),
                        value: decryptCookieValue(cookie.value),
                    }));
                },
                setAll(cookiesToSet) {
                    try {
                        // Consolidate any Supabase chunks, then encrypt & split for browser
                        const consolidated = reassembleChunkedCookies(
                            cookiesToSet.map(({ name, value }) => ({ name, value }))
                        );
                        const options = cookiesToSet[0]?.options || {};

                        for (const { name, value } of consolidated) {
                            const customName = toCustomCookieName(name);
                            const encrypted = encryptCookieValue(value);
                            const chunks = splitCookieValue(customName, encrypted);

                            // If chunking, delete the base cookie; if not, delete old chunks
                            if (chunks.length > 1) {
                                try { cookieStore.delete(customName); } catch { }
                            } else {
                                for (let i = 0; i < 5; i++) {
                                    try { cookieStore.delete(`${customName}.${i}`); } catch { }
                                }
                            }

                            for (const chunk of chunks) {
                                cookieStore.set(chunk.name, chunk.value, {
                                    ...options,
                                    httpOnly: true,
                                    secure: process.env.NODE_ENV === 'production',
                                    sameSite: 'lax',
                                });
                            }
                        }
                    } catch {
                        // Called from a Server Component
                    }
                },
            },
        }
    );
}
