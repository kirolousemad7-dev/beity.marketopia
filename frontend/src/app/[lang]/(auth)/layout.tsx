import { redirect } from "next/navigation";
import React from "react";

export const metadata = {
    title: "Account | Beity",
    description: "Sign in or create an account on Beity Household Electrical Appliances.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="auth-page-wrapper">
            <div className="auth-page-container">
                {children}
            </div>
        </div>
    );
}