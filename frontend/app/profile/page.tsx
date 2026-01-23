"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";

// This page redirects to /profile/[username]
const ProfilePage = () => {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const response = await usersApi.getCurrentUser();
        if (response.success && response.data) {
          const user: any = response.data.user;
          router.replace(`/profile/${user.username}`);
        } else {
          // If not logged in, redirect to login
          router.replace("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.replace("/login");
      }
    };
    redirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <p className="text-gray-900 dark:text-gray-100">Loading profile...</p>
    </div>
  );
};

export default ProfilePage;
