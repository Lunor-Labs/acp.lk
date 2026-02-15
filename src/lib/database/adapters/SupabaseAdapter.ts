import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabase, QueryBuilder, AuthUser, AuthSession } from '../IDatabase';

/**
 * Supabase Query Builder Implementation
 * Wraps Supabase query builder to match our interface
 */
class SupabaseQueryBuilder<T> implements QueryBuilder<T> {
    private query: any;

    constructor(private client: SupabaseClient, private tableName: string) {
        this.query = client.from(tableName);
    }

    select(columns?: string): QueryBuilder<T> {
        this.query = this.query.select(columns || '*');
        return this;
    }

    insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T> {
        this.query = this.query.insert(data);
        return this;
    }

    update(data: Partial<T>): QueryBuilder<T> {
        this.query = this.query.update(data);
        return this;
    }

    delete(): QueryBuilder<T> {
        this.query = this.query.delete();
        return this;
    }

    eq(column: keyof T, value: any): QueryBuilder<T> {
        this.query = this.query.eq(column as string, value);
        return this;
    }

    neq(column: keyof T, value: any): QueryBuilder<T> {
        this.query = this.query.neq(column as string, value);
        return this;
    }

    gt(column: keyof T, value: any): QueryBuilder<T> {
        this.query = this.query.gt(column as string, value);
        return this;
    }

    gte(column: keyof T, value: any): QueryBuilder<T> {
        this.query = this.query.gte(column as string, value);
        return this;
    }

    lt(column: keyof T, value: any): QueryBuilder<T> {
        this.query = this.query.lt(column as string, value);
        return this;
    }

    lte(column: keyof T, value: any): QueryBuilder<T> {
        this.query = this.query.lte(column as string, value);
        return this;
    }

    in(column: keyof T, values: any[]): QueryBuilder<T> {
        this.query = this.query.in(column as string, values);
        return this;
    }

    not(column: keyof T, operator: string, value: any): QueryBuilder<T> {
        this.query = this.query.not(column as string, operator, value);
        return this;
    }

    order(column: keyof T, options?: { ascending?: boolean }): QueryBuilder<T> {
        this.query = this.query.order(column as string, options);
        return this;
    }

    limit(count: number): QueryBuilder<T> {
        this.query = this.query.limit(count);
        return this;
    }

    async single(): Promise<{ data: T | null; error: Error | null }> {
        return await this.query.single();
    }

    async maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
        return await this.query.maybeSingle();
    }

    async execute(): Promise<{ data: T[] | null; error: Error | null; count?: number }> {
        return await this.query;
    }
}

/**
 * Supabase Database Adapter
 * Implements IDatabase interface for Supabase/PostgreSQL
 */
export class SupabaseAdapter implements IDatabase {
    private client: SupabaseClient;

    constructor(url: string, anonKey: string) {
        this.client = createClient(url, anonKey);
    }

    from<T>(table: string): QueryBuilder<T> {
        return new SupabaseQueryBuilder<T>(this.client, table);
    }

    auth = {
        signIn: async (email: string, password: string) => {
            const { data, error } = await this.client.auth.signInWithPassword({ email, password });
            return {
                user: data.user as AuthUser | null,
                error: error as Error | null
            };
        },

        signUp: async (email: string, password: string, metadata?: any) => {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: { data: metadata }
            });
            return {
                user: data.user as AuthUser | null,
                error: error as Error | null
            };
        },

        signOut: async () => {
            const { error } = await this.client.auth.signOut();
            return { error: error as Error | null };
        },

        getSession: async () => {
            const { data, error } = await this.client.auth.getSession();
            return {
                session: data.session as AuthSession | null,
                error: error as Error | null
            };
        },

        onAuthStateChange: (callback: (event: string, session: AuthSession | null) => void) => {
            const { data } = this.client.auth.onAuthStateChange((event, session) => {
                callback(event, session as AuthSession | null);
            });
            return { unsubscribe: () => data.subscription.unsubscribe() };
        }
    };
}
