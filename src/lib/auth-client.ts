import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
});

export const { signIn, signOut, signUp, useSession } = authClient;

// Profile management helpers. better-auth derives these from its
// /update-user and /change-password endpoints.
export const updateUser = authClient.updateUser;
export const changePassword = authClient.changePassword;
