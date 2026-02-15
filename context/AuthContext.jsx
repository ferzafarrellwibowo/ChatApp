import { useRouter, useSegments } from "expo-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "../firebase";
import { clearRememberMe, getRememberMe, setRememberMe as saveRememberMe } from "../utils/secureStore";

const AuthContext = createContext({});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isLoggingOut = useRef(false);
    const router = useRouter();
    const segments = useSegments();

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth(), async (firebaseUser) => {
            // If we're in the middle of a manual logout, don't interfere
            if (isLoggingOut.current) {
                return;
            }

            if (firebaseUser) {
                // User is signed in — check rememberMe preference
                const remembered = await getRememberMe();

                if (remembered === false) {
                    // User did NOT check "Remember Me" last time.
                    // Auto logout on app restart.
                    isLoggingOut.current = true;
                    try {
                        await clearRememberMe();
                        await signOut(auth());
                    } catch (e) {
                        console.warn("Auto-logout failed:", e);
                    }
                    setUser(null);
                    setLoading(false);
                    isLoggingOut.current = false;
                    return;
                }

                // rememberMe is true (or first-time / not set) — keep session
                setUser(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Redirect based on auth state
    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === "(tabs)" || segments[0] === "chat";

        if (user && !inAuthGroup) {
            router.replace("/(tabs)");
        } else if (!user && inAuthGroup) {
            router.replace("/");
        }
    }, [user, loading, segments]);

    // Login function with rememberMe support
    const login = async (email, password, rememberMe = false) => {
        await signInWithEmailAndPassword(auth(), email.trim(), password);
        await saveRememberMe(rememberMe);
    };

    // Logout function — clears rememberMe, signs out, navigates immediately
    const logout = async () => {
        isLoggingOut.current = true;
        try {
            await clearRememberMe();
            await signOut(auth());
            setUser(null);
            // Navigate immediately — don't wait for onAuthStateChanged
            router.replace("/");
        } catch (e) {
            console.error("Logout failed:", e);
            throw e;
        } finally {
            isLoggingOut.current = false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
