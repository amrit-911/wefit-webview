import { useAuth } from "@/providers/auth-provider";

/**
 * Convenience hook — returns the user's role and a set of booleans.
 *
 * Usage:
 *   const { isAdmin, isTrainer, isUser, role } = useRole();
 */
export function useRole() {
  const { role, user, loading } = useAuth();

  
  return {
    role,
    user,
    loading,
    isAdmin: role === "admin",
    isTrainer: role === "trainer",
    isUser: role === "user",
  };
}
