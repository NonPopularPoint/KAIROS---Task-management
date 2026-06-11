"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) router.push("/dashboard");
  }, [user, authLoading, router]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) { setError("No credential received from Google"); return; }
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<{ token: string; user: any }>("/auth/google", { token: credentialResponse.credential });
      localStorage.setItem("kairos_token", response.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Failed to sign in with Google.");
    }
  };

  const handleGoogleError = () => setError("Google sign-in was cancelled or failed.");

  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F0EB" }}><div className="animate-shimmer w-80 h-12 rounded-lg" /></div>;
  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F0EB" }}>
      <div className="w-full max-w-sm mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "#6366F1" }}>
            <Image src="/logo.png" alt="KAIROS" width={36} height={36} className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">KAIROS</h1>
          <p className="text-sm mt-1 text-gray-500">Sign in to your workspace</p>
        </div>

        {/* Simple card — minimal, no border, just soft shadow */}
        <div className="p-0">
          {error && (
            <div className="mb-4 p-3 text-sm rounded-lg" style={{ backgroundColor: "#FFF0EE", color: "#CC4A3D" }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-3 rounded-lg w-full text-sm font-medium bg-gray-100 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-kairos-600" />
              Signing in...
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>
          )}

          <div className="mt-6 pt-5 text-center border-t" style={{ borderColor: "#E0D9D2" }}>
            <p className="text-xs" style={{ color: "#A6A09A" }}>
              By joining, you agree to our{" "}
              <a href="#" className="font-medium text-kairos-600 hover:text-kairos-700">Terms</a>
              {" "}and{" "}
              <a href="#" className="font-medium text-kairos-600 hover:text-kairos-700">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
