import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const registerUser = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Semua field harus diisi.");
      return;
    }

    setLoading(true);
    try {
      const q = query(usersRef, where("username", "==", username.trim()));
      const check = await getDocs(q);

      if (!check.empty) {
        setLoading(false);
        Alert.alert("Error", "Username sudah dipakai.");
        return;
      }

      const res = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await setDoc(doc(usersRef, res.user.uid), {
        username: username.trim(),
        email: email.trim(),
        createdAt: new Date(),
      });

      Alert.alert("Sukses", "Akun berhasil dibuat!");
      router.replace("/");
    } catch (e) {
      console.log(e);
      let msg = "Registrasi gagal.";

      if (e.code === "auth/email-already-in-use") msg = "Email sudah terdaftar.";
      if (e.code === "auth/invalid-email") msg = "Email tidak valid.";
      if (e.code === "auth/weak-password") msg = "Password minimal 6 karakter.";

      Alert.alert("Gagal", msg);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding" })}
        style={{ flex: 1, width: "100%" }}
      >
        <View style={styles.top}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register to start chatting</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Text style={styles.eyeIcon}>{showPassword ? "○" : "●"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading ? styles.buttonDisabled : null]}
            onPress={registerUser}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
          </TouchableOpacity>

          <View style={styles.row}>
            <Text>Sudah punya akun?</Text>
            <TouchableOpacity onPress={() => router.push("/")}>
              <Text style={styles.link}> Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: "center", 
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  top: { marginTop: 36, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { marginTop: 6, color: "#475569" },
  form: { width: "90%", marginTop: 26, alignSelf: "center" },
  input: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
  },
  eyeButton: {
    padding: 12,
    marginRight: 4,
  },
  eyeIcon: {
    fontSize: 20,
    color: "#0ea5a5",
    fontWeight: "600",
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
  link: { color: "#0ea5a5", fontWeight: "600" },
});
