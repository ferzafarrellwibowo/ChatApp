import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  auth,
  signInWithEmailAndPassword,
} from "../firebase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const loginUser = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Email & Password harus diisi");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/chat");
    } catch (e) {
      console.log(e);

      let msg = "Login gagal.";
      if (e.code === "auth/invalid-email") msg = "Email tidak valid.";
      if (e.code === "auth/user-not-found") msg = "Akun tidak ditemukan.";
      if (e.code === "auth/wrong-password") msg = "Password salah.";

      Alert.alert("Gagal", msg);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding" })}
        style={{ flex: 1, width: "100%" }}
      >
        <View style={styles.top}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity
            style={[styles.button, loading ? styles.buttonDisabled : null]}
            onPress={loginUser}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={styles.text}>Belum punya akun?</Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.link}> Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#fff" },
  top: { marginTop: 36, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { marginTop: 6, color: "#475569" },
  form: { marginTop: 26, width: "90%", alignSelf: "center" },
  input: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  button: {
    backgroundColor: "#0ea5a5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
  text: { color: "#475569" },
  link: { color: "#0ea5a5", fontWeight: "600" },
});
