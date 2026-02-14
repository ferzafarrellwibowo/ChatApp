import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, onAuthStateChanged, signInWithEmailAndPassword } from "../firebase";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth(), (user) => {
            if (user) router.replace("/(tabs)");
            else setChecking(false);
        });
        return unsub;
    }, []);

    const loginUser = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Email & Password harus diisi");
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth(), email.trim(), password);
            router.replace("/(tabs)");
        } catch (e) {
            console.error('Login error:', e);
            let msg = "Login gagal.";
            if (e && e.code === "auth/invalid-email") msg = "Email tidak valid.";
            if (e && e.code === "auth/user-not-found") msg = "Akun tidak ditemukan.";
            if (e && e.code === "auth/wrong-password") msg = "Password salah.";
            if (e && e.code === "auth/invalid-credential") msg = "Email atau password salah.";
            const details = e && (e.message || e.code) ? `\n\nDetails: ${e.message || e.code}` : "";
            Alert.alert("Gagal", msg + details);
        }
        setLoading(false);
    };

    if (checking) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.logoWrap}>
                        <View style={styles.logoBox}>
                            <Ionicons name="chatbubbles" size={32} color="#3B82F6" />
                        </View>
                        <Text style={styles.appName}>Vibey</Text>
                        <Text style={styles.subtitle}>Welcome back! Please enter your details.</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="mail-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput
                                placeholder="email@vibey.com"
                                placeholderTextColor="#64748B"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                style={styles.input}
                            />
                        </View>

                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput
                                placeholder="••••••••"
                                placeholderTextColor="#64748B"
                                secureTextEntry={!showPass}
                                value={password}
                                onChangeText={setPassword}
                                style={styles.input}
                            />
                            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={loginUser}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Text style={styles.buttonText}>Login</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.row}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push("/register")}>
                                <Text style={styles.link}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
    logoWrap: { alignItems: "center", marginBottom: 32 },
    logoBox: {
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: "#1E3A5F", justifyContent: "center", alignItems: "center",
        marginBottom: 16,
    },
    appName: { fontSize: 32, fontWeight: "800", color: "#fff", marginBottom: 8 },
    subtitle: { fontSize: 14, color: "#94A3B8", textAlign: "center" },
    form: { width: "100%" },
    label: { color: "#CBD5E1", fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 16 },
    inputWrap: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#1E293B", borderRadius: 14, paddingHorizontal: 14,
        borderWidth: 1, borderColor: "#334155", height: 52,
    },
    input: { flex: 1, color: "#fff", fontSize: 15 },
    button: {
        backgroundColor: "#3B82F6", paddingVertical: 16, borderRadius: 14,
        alignItems: "center", marginTop: 28,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    row: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
    footerText: { color: "#94A3B8", fontSize: 14 },
    link: { color: "#3B82F6", fontWeight: "700", fontSize: 14 },
});
