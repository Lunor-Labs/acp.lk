import { ProfileRepository } from '../repositories/ProfileRepository.js';
import type { NewProfile } from '../repositories/schema/index.js';
import { IAuthProvider } from '../providers/auth/IAuthProvider.js';
export declare class UserService {
    private authProvider;
    private profileRepo;
    constructor(authProvider: IAuthProvider);
    /**
     * Resolve an identifier (email OR student ID) to an email address.
     */
    private resolveEmail;
    /**
     * Sign in using email or student ID + password.
     * Returns a JWT token and the user profile.
     */
    signIn(identifier: string, password: string): Promise<{
        token: string;
        profile: {
            id: string;
            email: string;
            full_name: string;
            role: "admin" | "teacher" | "student";
            is_active: boolean;
            phone: string | null;
            avatar_url: string | null;
            student_id: string | null;
            al_year: number | null;
            center: "online" | "riochem" | "vision" | null;
            nic: string | null;
            whatsapp_no: string | null;
            mobile_no: string | null;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: "admin" | "teacher" | "student";
        is_active: boolean;
        phone: string | null;
        avatar_url: string | null;
        student_id: string | null;
        al_year: number | null;
        center: "online" | "riochem" | "vision" | null;
        nic: string | null;
        whatsapp_no: string | null;
        mobile_no: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    updateProfile(userId: string, updates: Partial<NewProfile>): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: "admin" | "teacher" | "student";
        is_active: boolean;
        phone: string | null;
        avatar_url: string | null;
        student_id: string | null;
        al_year: number | null;
        center: "online" | "riochem" | "vision" | null;
        nic: string | null;
        whatsapp_no: string | null;
        mobile_no: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    /**
     * Step 1: Send a sign-up OTP to the provided email.
     * Returns a pre-generated student ID so the frontend can display it to the user.
     */
    requestSignUpOtp(email: string, data: {
        fullName: string;
        alYear: number;
        center: 'online' | 'riochem' | 'vision';
        nic: string;
        whatsappNo: string;
        mobileNo: string;
        password?: string;
    }): Promise<{
        studentId: string;
    }>;
    /**
     * Step 2: Verify OTP and create the profile in the DB.
     */
    verifySignUpOtp(email: string, token: string, data: {
        fullName: string;
        alYear: number;
        center: 'online' | 'riochem' | 'vision';
        password?: string;
        studentId?: string;
    }): Promise<{
        user: {
            id: string;
        };
        profile: Awaited<ReturnType<ProfileRepository['create']>>;
    }>;
    /**
     * Step 1: Send a password-reset OTP.
     * Accepts email or student ID as identifier.
     * Returns the resolved email so the frontend can display it.
     */
    requestPasswordResetOtp(identifier: string): Promise<{
        email: string;
    }>;
    /**
     * Step 2: Verify OTP and set a new password.
     */
    resetPasswordWithOtp(email: string, token: string, newPassword: string): Promise<void>;
}
//# sourceMappingURL=userService.d.ts.map