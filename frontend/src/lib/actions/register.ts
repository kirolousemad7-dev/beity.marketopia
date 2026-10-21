import { RegisterSchema, RegisterFormData } from "@/lib/schemas";

export async function submitForm(formData: RegisterFormData) {
  // 1. Validate data on the server
  const validation = RegisterSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid form data",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const apiPayload = {
    name: validation.data.fullName,
    email: validation.data.email,
    password: validation.data.password,
    password_confirmation: validation.data.password,
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    console.info("[submitToExternalApi] Mocking outsource API call:", {
      name: apiPayload.name,
      email: apiPayload.email,
    });
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      message: "Registration successful! Welcome to Beity.",
      data: {
        name: apiPayload.name,
        email: apiPayload.email,
      },
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers,
      body: JSON.stringify(apiPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        errors: response.status === 422 ? result.errors : null,
        message: result.message || "Failed to register with third-party service.",
      };
    }

    return {
      success: true,
      message: "Registration successful!",
      data: result,
    };
  } catch (error) {
    console.error("submitToExternalApi error:", error);
    return {
      success: false,
      message: "Network error: Unable to reach external service. Please try again later.",
    };
  }


}