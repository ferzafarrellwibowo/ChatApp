import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";
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
import {
    auth,
    createUserWithEmailAndPassword,
    doc,
    getDocs,
    query,
    setDoc,
    usersRef,
    where,
} from "../firebase";

export default function Register() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    const registerUser = async () => {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
            Alert.alert("Error", "Semua field harus diisi.");
            return;
        }
        if (password !== confirmPass) {
            Alert.alert("Error", "Password tidak cocok.");
            return;
        }
        if (!agreed) {
            Alert.alert("Error", "Kamu harus menyetujui Terms and Conditions.");
            return;
        }

        setLoading(true);
        try {
            const q = query(usersRef, where("username", "==", fullName.trim()));
            const check = await getDocs(q);
            if (!check.empty) {
                setLoading(false);
                Alert.alert("Error", "Username sudah dipakai.");
                return;
            }

            const res = await createUserWithEmailAndPassword(auth(), email.trim(), password);
            await setDoc(doc(usersRef, res.user.uid), {
                username: fullName.trim(),
                email: email.trim(),
                createdAt: new Date(),
                avatar: "",
                status: "Hey, I'm using Vibey!",
            });

            Alert.alert("Sukses", "Akun berhasil dibuat!");
            router.replace("/");
        } catch (e) {
            console.error('Registration error:', e);
            let msg = "Registrasi gagal.";
            if (e && e.code === "auth/email-already-in-use") msg = "Email sudah terdaftar.";
            if (e && e.code === "auth/invalid-email") msg = "Email tidak valid.";
            if (e && e.code === "auth/weak-password") msg = "Password minimal 6 karakter.";
            const details = e && (e.message || e.code) ? `\n\nDetails: ${e.message || e.code}` : "";
            Alert.alert("Gagal", msg + details);
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                        <Text style={styles.headerTitle}>Create Account</Text>
                    </TouchableOpacity>

                    <View style={styles.logoBox}>
                        <Ionicons name="chatbubbles" size={26} color="#3B82F6" />
                    </View>
                    <Text style={styles.title}>Join Vibey</Text>
                    <Text style={styles.subtitle}>Connect with your world professionally.</Text>

                    {/* Form */}
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="person-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                        <TextInput
                            placeholder="Enter your full name"
                            placeholderTextColor="#64748B"
                            value={fullName}
                            onChangeText={setFullName}
                            style={styles.input}
                            autoCapitalize="words"
                        />
                    </View>

                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="mail-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                        <TextInput
                            placeholder="example@vibey.com"
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

                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                        <TextInput
                            placeholder="••••••••"
                            placeholderTextColor="#64748B"
                            secureTextEntry={!showConfirm}
                            value={confirmPass}
                            onChangeText={setConfirmPass}
                            style={styles.input}
                        />
                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                            <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Terms */}
                    <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)}>
                        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                            {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text style={styles.termsText}>
                            I agree to the <Text style={styles.link}>Terms and Conditions</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={registerUser}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Text style={styles.buttonText}>Create Account</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push("/")}>
                            <Text style={styles.link}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    scroll: { flexGrow: 1, padding: 24, paddingTop: 12 },
    backRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
    headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
    logoBox: {
        width: 56, height: 56, borderRadius: 16,
        backgroundColor: "#1E3A5F", justifyContent: "center", alignItems: "center",
        marginBottom: 16,
    },
    title: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 6 },
    subtitle: { fontSize: 14, color: "#94A3B8", marginBottom: 20 },
    label: { color: "#CBD5E1", fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 12 },
    inputWrap: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#1E293B", borderRadius: 14, paddingHorizontal: 14,
        borderWidth: 1, borderColor: "#334155", height: 52,
    },
    input: { flex: 1, color: "#fff", fontSize: 15 },
    termsRow: { flexDirection: "row", alignItems: "center", marginTop: 20 },
    checkbox: {
        width: 22, height: 22, borderRadius: 6, borderWidth: 2,
        borderColor: "#475569", marginRight: 10, justifyContent: "center", alignItems: "center",
    },
    checkboxChecked: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
    termsText: { color: "#94A3B8", fontSize: 13 },
    link: { color: "#3B82F6", fontWeight: "700" },
    button: {
        backgroundColor: "#3B82F6", paddingVertical: 16, borderRadius: 14,
        alignItems: "center", marginTop: 24,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 20, marginBottom: 30 },
    footerText: { color: "#94A3B8", fontSize: 14 },
});
