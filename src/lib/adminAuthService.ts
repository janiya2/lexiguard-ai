/**
 * Admin Authentication & Role-Based Access Control Service for LexiGuard AI
 * Supports Super Admin creation, registration locking, password hashing, and Firestore sync.
 */

import { db } from "./firebase";
import { doc, getDoc, setDoc, getDocs, collection, updateDoc } from "firebase/firestore";

export type AdminRole = "super_admin" | "admin" | "auditor";

export interface AdminAccount {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: AdminRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface AdminSecurityConfig {
  allowAdminRegistration: boolean;
  maxFailedAttempts: number;
  sessionTimeoutHours: number;
  initialSetupCompleted: boolean;
}

const DEFAULT_SECURITY_CONFIG: AdminSecurityConfig = {
  allowAdminRegistration: true, // Initially true so first admin can register
  maxFailedAttempts: 5,
  sessionTimeoutHours: 24,
  initialSetupCompleted: false,
};

const LOCAL_STORAGE_SESSION_KEY = "lexiguard_active_admin_session";
const LOCAL_STORAGE_ACCOUNTS_KEY = "lexiguard_admin_accounts";
const LOCAL_STORAGE_CONFIG_KEY = "lexiguard_admin_security_config";

// SHA-256 helper with salt using native Web Crypto API
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt + "lexiguard_salt_seed");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 1. Fetch Admin Security Config
export async function getAdminSecurityConfig(): Promise<AdminSecurityConfig> {
  if (typeof window === "undefined") return DEFAULT_SECURITY_CONFIG;

  try {
    const configDoc = await getDoc(doc(db, "lexiguard_admin_settings", "security"));
    if (configDoc.exists()) {
      const data = configDoc.data() as AdminSecurityConfig;
      localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Could not load remote admin config from Firestore, falling back to local:", err);
  }

  const cached = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  return DEFAULT_SECURITY_CONFIG;
}

// 2. Save Admin Security Config (e.g. toggle allowAdminRegistration)
export async function saveAdminSecurityConfig(
  config: Partial<AdminSecurityConfig>
): Promise<boolean> {
  try {
    const current = await getAdminSecurityConfig();
    const updated = { ...current, ...config };

    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(updated));

    await setDoc(doc(db, "lexiguard_admin_settings", "security"), updated, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving admin security config:", err);
    return false;
  }
}

// 3. Get All Admin Accounts
export async function getAdminAccounts(): Promise<AdminAccount[]> {
  if (typeof window === "undefined") return [];

  try {
    const snapshot = await getDocs(collection(db, "lexiguard_admins"));
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as AdminAccount);
      localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn("Error fetching remote admin accounts from Firestore:", err);
  }

  const cached = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  return [];
}

// 4. Check if registration is currently permitted
export async function isRegistrationAllowed(): Promise<boolean> {
  const accounts = await getAdminAccounts();
  const config = await getAdminSecurityConfig();

  // If there are zero admin accounts registered, ALWAYS allow initial admin creation!
  if (accounts.length === 0) {
    return true;
  }

  return config.allowAdminRegistration;
}

// 5. Create New Admin Account (Initial Setup or Super Admin invite)
export async function createAdminAccount(params: {
  username: string;
  email: string;
  displayName: string;
  password: string;
  role?: AdminRole;
}): Promise<{ success: boolean; error?: string; account?: AdminAccount }> {
  const existingAccounts = await getAdminAccounts();
  const allowed = await isRegistrationAllowed();

  if (!allowed && existingAccounts.length > 0) {
    return {
      success: false,
      error: "Admin account creation is currently disabled by the Super Administrator.",
    };
  }

  const cleanUsername = params.username.trim().toLowerCase();
  const cleanEmail = params.email.trim().toLowerCase();

  // Check if username or email already taken
  const exists = existingAccounts.some(
    (a) => a.username.toLowerCase() === cleanUsername || a.email.toLowerCase() === cleanEmail
  );
  if (exists) {
    return {
      success: false,
      error: "An administrator with this username or email already exists.",
    };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(params.password, salt);

  // If this is the very first account, assign 'super_admin'
  const assignedRole: AdminRole = existingAccounts.length === 0 ? "super_admin" : params.role || "admin";

  const newAccount: AdminAccount = {
    id: "admin-" + Date.now(),
    username: cleanUsername,
    email: cleanEmail,
    displayName: params.displayName.trim() || cleanUsername,
    role: assignedRole,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  const updatedList = [...existingAccounts, newAccount];
  localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(updatedList));

  try {
    await setDoc(doc(db, "lexiguard_admins", newAccount.id), newAccount);
  } catch (err) {
    console.warn("Could not save admin account to Firestore, saved to local cache:", err);
  }

  // If first admin, mark initialSetupCompleted
  if (existingAccounts.length === 0) {
    await saveAdminSecurityConfig({ initialSetupCompleted: true });
  }

  return { success: true, account: newAccount };
}

// 6. Login Admin
export async function loginAdmin(
  usernameOrEmail: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string; admin?: AdminAccount }> {
  const accounts = await getAdminAccounts();
  const clean = usernameOrEmail.trim().toLowerCase();

  const account = accounts.find(
    (a) => a.username.toLowerCase() === clean || a.email.toLowerCase() === clean
  );

  if (!account) {
    return { success: false, error: "Invalid administrator credentials." };
  }

  if (!account.isActive) {
    return { success: false, error: "This administrator account has been deactivated." };
  }

  // Verify password hash
  const computedHash = await hashPassword(passwordInput, account.salt);
  if (computedHash !== account.passwordHash) {
    return { success: false, error: "Incorrect password. Access denied." };
  }

  // Verify role
  if (account.role !== "super_admin" && account.role !== "admin") {
    return { success: false, error: "Access denied. Admin role required." };
  }

  // Update lastLoginAt
  account.lastLoginAt = new Date().toISOString();
  try {
    await updateDoc(doc(db, "lexiguard_admins", account.id), {
      lastLoginAt: account.lastLoginAt,
    });
  } catch {}

  // Store active session
  if (typeof window !== "undefined") {
    sessionStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(account));
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(account));
  }

  return { success: true, admin: account };
}

// 7. Get Active Session
export function getActiveAdminSession(): AdminAccount | null {
  if (typeof window === "undefined") return null;

  const session =
    sessionStorage.getItem(LOCAL_STORAGE_SESSION_KEY) ||
    localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);

  if (!session) return null;

  try {
    return JSON.parse(session) as AdminAccount;
  } catch {
    return null;
  }
}

// 8. Logout Admin
export function logoutAdmin(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  }
}
