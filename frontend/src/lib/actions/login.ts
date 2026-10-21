import { LoginSchema, LoginFormData } from "@/lib/schemas";
import { UserProfile } from "@/lib/types";

export interface LoginResult {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
  errors?: Record<string, string[]>;
}

export async function login(formData: LoginFormData): Promise<LoginResult> {
  const validation = LoginSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid login credentials.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  const loginUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(loginUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Invalid email or password.",
      };
    }

    const token = result.data?.token;
    const user = result.data?.user;

    if (token) {
      localStorage.setItem("auth_token", token);

      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
      }
    }

    return {
      success: true,
      message: "Signed in successfully!",
      data: {
        token,
        user,
      }
    };
  } catch (error) {
    console.error("login error:", error);
    return {
      success: false,
      message: "Network error: Unable to reach external authentication service.",
    };
  }
}

export async function logoutAction() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  return { success: true };
}

export async function getSessionUser(): Promise<UserProfile | null> {
  const token = localStorage.getItem("auth_token");
  const userStr = localStorage.getItem("auth_user");

  if (!token || !userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}
