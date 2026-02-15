import * as SecureStore from "expo-secure-store";

const REMEMBER_ME_KEY = "rememberMe";

/**
 * Save the rememberMe preference securely.
 * @param {boolean} value
 */
export async function setRememberMe(value) {
    try {
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, JSON.stringify(!!value));
    } catch (e) {
        console.warn("SecureStore setRememberMe error:", e);
    }
}

/**
 * Get the rememberMe preference.
 * Returns true, false, or null if never set.
 * @returns {Promise<boolean|null>}
 */
export async function getRememberMe() {
    try {
        const value = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
        if (value === null) return null;
        return JSON.parse(value);
    } catch (e) {
        console.warn("SecureStore getRememberMe error:", e);
        return null;
    }
}

/**
 * Clear the rememberMe preference on logout.
 */
export async function clearRememberMe() {
    try {
        await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
    } catch (e) {
        console.warn("SecureStore clearRememberMe error:", e);
    }
}
