"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FriendsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      router.replace(`/connect?tab=${tab}`);
    } else {
      router.replace("/connect");
    }
  }, [router, searchParams]);

  return null;
}

export default function FriendsPage() {
  return (
    <Suspense fallback={null}>
      <FriendsRedirect />
    </Suspense>
  );
}
