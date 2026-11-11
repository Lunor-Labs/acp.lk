/**
 * Database Abstraction Layer
 * 
 * This interface defines the contract for database operations,
 * allowing easy switching between different database providers
 * (Supabase, Firebase, etc.)
 */

export interface QueryBuilder<T> {
    select(columns?: string): QueryBuilder<T>;
    insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T>;
    update(data: Partial<T>): QueryBuilder<T>;
    delete(): QueryBuilder<T>;
    eq(column: keyof T, value: any): QueryBuilder<T>;
    neq(column: keyof T, value: any): QueryBuilder<T>;
    gt(column: keyof T, value: any): QueryBuilder<T>;
    gte(column: keyof T, value: any): QueryBuilder<T>;
    lt(column: keyof T, value: any): QueryBuilder<T>;
    lte(column: keyof T, value: any): QueryBuilder<T>;
    in(column: keyof T, values: any[]): QueryBuilder<T>;
    not(column: keyof T, operator: string, value: any): QueryBuilder<T>;
    order(column: keyof T, options?: { ascending?: boolean }): QueryBuilder<T>;
    limit(count: number): QueryBuilder<T>;
    single(): Promise<{ data: T | null; error: Error | null }>;
    maybeSingle(): Promise<{ data: T | null; error: Error | null }>;
    execute(): Promise<{ data: T[] | null; error: Error | null; count?: number }>;
}

export interface AuthUser {
    id: string;
    email?: string;
    [key: string]: any;
}

export interface AuthSession {
    user: AuthUser | null;
    [key: string]: any;
}

export interface IDatabase {
    // Table operations
    from<T>(table: string): QueryBuilder<T>;

    // Auth operations
    auth: {
        signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }>;
        signUp(email: string, password: string, metadata?: any): Promise<{ user: AuthUser | null; error: Error | null }>;
        signOut(): Promise<{ error: Error | null }>;
        resetPassword(email: string): Promise<{ error: Error | null }>;
        getSession(): Promise<{ session: AuthSession | null; error: Error | null }>;
        onAuthStateChange(callback: (event: string, session: AuthSession | null) => void): { unsubscribe: () => void };
        /** Send an OTP to the given email (creates user if new). Optional metadata is passed to the email template. */
        sendOtp(email: string, metadata?: Record<string, string>): Promise<{ error: Error | null }>;
        /** Verify the OTP token for the given email */
        verifyOtp(email: string, token: string): Promise<{ user: AuthUser | null; error: Error | null }>;
        /** Update the currently signed-in user's password */
        updatePassword(password: string): Promise<{ error: Error | null }>;
    };
}
