/**
 * Database Types
 * -------------
 * Type definitions for database operations
 */

export interface SiteAuthorization {
    site_id: string;
    access_token: string;
}

export interface UserAuthorization {
    user_id: string;
    access_token: string;
}

export interface ApiKeyEntry {
    user_id: string;
    site_id: string;
    provider: string;
    encrypted_key: string;
}

export interface ProviderSelection {
    user_id: string;
    site_id: string;
    provider: string;
}

export interface AuthResponse {
    sites: SiteAuthorization[];
    users: UserAuthorization[];
}
