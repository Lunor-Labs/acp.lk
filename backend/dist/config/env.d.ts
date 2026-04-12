import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    DATABASE_URL: z.ZodString;
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_KEY: z.ZodString;
    SUPABASE_JWT_SECRET: z.ZodString;
    STORAGE_BUCKET: z.ZodDefault<z.ZodString>;
    FRONTEND_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    PORT: string;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_KEY: string;
    SUPABASE_JWT_SECRET: string;
    STORAGE_BUCKET: string;
    FRONTEND_URL: string;
}, {
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_KEY: string;
    SUPABASE_JWT_SECRET: string;
    PORT?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    STORAGE_BUCKET?: string | undefined;
    FRONTEND_URL?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare const env: {
    PORT: string;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_KEY: string;
    SUPABASE_JWT_SECRET: string;
    STORAGE_BUCKET: string;
    FRONTEND_URL: string;
};
export {};
//# sourceMappingURL=env.d.ts.map