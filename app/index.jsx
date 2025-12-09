import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
    collection,
    db,
    getDocs,
    query,
    signInWithEmailAndPassword,
    where,
} from "../firebase";

import { clearCredentials, loadCredentials, saveCredentials } from "../utils/storage";

export default function Login() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Auto login jika ada kredensial tersimpan
    const tryAutoLogin = async () => {
      const credentials = await loadCredentials();
      if (credentials && credentials.email && credentials.password) {
        setEmailOrUsername(credentials.email);
        setPassword(credentials.password);
        setRememberMe(true);
        // Auto login
        autoLogin(credentials.email, credentials.password);
      }
    };
    tryAutoLogin();
  }, []);

  const autoLogin = async (savedEmailOrUsername, savedPassword) => {
    setLoading(true);
    try {
      let emailToLogin = savedEmailOrUsername;
      
      // Cek apakah yang tersimpan adalah username atau email
      if (!savedEmailOrUsername.includes("@")) {
        // Yang tersimpan adalah username, cari email dari Firestore
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", savedEmailOrUsername));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.log("Auto login failed: Username not found");
          await clearCredentials();
          setLoading(false);
          return;
        }
        
        // Ambil email dari dokumen user
        const userDoc = querySnapshot.docs[0];
        emailToLogin = userDoc.data().email;
      }
      
      await signInWithEmailAndPassword(auth, emailToLogin, savedPassword);
      router.replace("/chat");
    } catch (e) {
      console.log("Auto login failed:", e);
      // Jika auto login gagal, hapus kredensial tersimpan
      await clearCredentials();
    }
    setLoading(false);
  };

  const loginUser = async () => {
    if (!emailOrUsername.trim() || !password.trim()) {
      Alert.alert("Error", "Email/Username & Password harus diisi");
      return;
    }

    setLoading(true);
    try {
      let emailToLogin = emailOrUsername.trim();
      
      // Cek apakah input adalah username atau email
      if (!emailOrUsername.includes("@")) {
        // Input adalah username, cari email dari Firestore
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", emailOrUsername.trim()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          Alert.alert("Gagal", "Username tidak ditemukan.");
          setLoading(false);
          return;
        }
        
        // Ambil email dari dokumen user
        const userDoc = querySnapshot.docs[0];
        emailToLogin = userDoc.data().email;
      }
      
      // Login menggunakan email
      await signInWithEmailAndPassword(auth, emailToLogin, password);
      
      // Simpan kredensial jika Remember Me dicentang
      if (rememberMe) {
        await saveCredentials(emailOrUsername.trim(), password);
      } else {
        await clearCredentials();
      }
      
      router.replace("/chat");
    } catch (e) {
      console.log(e);

      let msg = "Login gagal.";
      if (e.code === "auth/invalid-email") msg = "Email tidak valid.";
      if (e.code === "auth/user-not-found") msg = "Akun tidak ditemukan.";
      if (e.code === "auth/wrong-password") msg = "Password salah.";
      if (e.code === "auth/invalid-credential") msg = "Email/Username atau Password salah.";

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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Email atau Username"
            autoCapitalize="none"
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
            style={styles.input}
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
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberMeText}>Remember Me</Text>
          </TouchableOpacity>

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
  container: { 
    flex: 1, 
    alignItems: "center", 
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
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
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#0ea5a5",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#0ea5a5",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  rememberMeText: {
    color: "#475569",
    fontSize: 14,
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
