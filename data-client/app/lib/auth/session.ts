import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

/**
 * Session type definition
 */
export type Session = {
    userId: string;
    siteId: string;
    accessToken: string;
};

/**
 * Gets the current session information from the request
 * Verifies the JWT token and returns the session data
 * 
 * @returns Promise<Session | null>
 */
export async function getSession(): Promise<Session | null> {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return null;
    }

    try {
        const secret = new TextEncoder().encode(process.env.ENCRYPTION_KEY);
        const { payload } = await jwtVerify(token, secret);
        
        if (!payload.userId || !payload.siteId || !payload.accessToken) {
            return null;
        }

        return {
            userId: payload.userId as string,
            siteId: payload.siteId as string,
            accessToken: payload.accessToken as string
        };
    } catch (error) {
        console.error('Session verification failed:', error);
        return null;
    }
}
