"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is adding an account
    const isAddingAccount =
      typeof window !== "undefined" &&
      localStorage.getItem("addingAccount") === "true";

    // If authenticated and NOT adding an account, redirect to home
    // If adding an account, allow access to login/signup even when authenticated
    if (isAuthenticated() && !isAddingAccount) {
      router.push("/home");
    }
  }, [router]);

  return <>{children}</>;
}
