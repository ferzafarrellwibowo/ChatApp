import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
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
    addDoc,
    auth,
    doc,
    getDoc,
    getDownloadURL,
    messagesRef,
    onSnapshot,
    orderBy,
    query,
    ref,
    serverTimestamp,
    signOut,
    storage,
    uploadBytes,
    usersRef,
} from "../firebase";

import { clearCredentials, loadMessages, saveMessages } from "../utils/storage";

export default function Chat() {
  const router = useRouter();
  const flatRef = useRef(null);

  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // load username
  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDoc = await getDoc(doc(usersRef, uid));
      if (userDoc.exists()) setUsername(userDoc.data().username);
      else setUsername(auth.currentUser.email.split("@")[0]);
    })();
  }, []);

  // load cached
  useEffect(() => {
    (async () => {
      const saved = await loadMessages();
      if (saved) setMessages(saved);
    })();
  }, []);

  // realtime listener
  useEffect(() => {
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, async (snap) => {
      const arr = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toMillis?.() || Date.now(),
      }));

      setMessages(arr);
      saveMessages(arr);
      setLoading(false);

      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
    });

    return () => unsub();
  }, []);

  const sendText = async () => {
    if (!text.trim()) return;
    setSending(true);

    try {
      await addDoc(messagesRef, {
        text: text.trim(),
        user: username,
        createdAt: serverTimestamp(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  };

  const showAttachmentMenu = () => {
    setShowAttachMenu(true);
  };

  const pickImage = async () => {
    setShowAttachMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled) return;

    const img = result.assets[0];
    setSending(true);

    try {
      const blob = await (await fetch(img.uri)).blob();
      const imageRef = ref(storage, `images/${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob);
      const url = await getDownloadURL(imageRef);

      await addDoc(messagesRef, {
        image: url,
        user: username,
        createdAt: serverTimestamp(),
      });
    } finally {
      setSending(false);
    }
  };

  const attachFile = async () => {
    setShowAttachMenu(false);
    Alert.alert("Fitur File", "Fitur attach file sedang dalam pengembangan");
  };

  const logout = async () => {
    try {
      await clearCredentials(); // Hapus kredensial tersimpan
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const renderItem = ({ item }) => {
    const mine = item.user === username;

    return (
      <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
        {!mine && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.user.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={styles.sender}>{mine ? "You" : item.user}</Text>
          {item.text && <Text style={styles.msgText}>{item.text}</Text>}
          {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5a5" />
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Room</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} size="large" />
        ) : (
          <FlatList
            data={messages}
            ref={flatRef}
            renderItem={renderItem}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          />
        )}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrap}>
            <TouchableOpacity onPress={showAttachmentMenu} style={styles.iconButton}>
              <Text style={styles.icon}>+</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={text}
              placeholder="Tulis pesan..."
              placeholderTextColor="#94A3B8"
              onChangeText={setText}
            />

            <TouchableOpacity 
              onPress={sendText} 
              disabled={sending || !text.trim()}
              style={styles.sendButton}
            >
              <Text style={styles.send}>{sending ? "..." : "➤"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showAttachMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachMenu(false)}
        >
          <View style={styles.attachMenu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={pickImage}
            >
              <Text style={styles.menuIcon}>🖼️</Text>
              <Text style={styles.menuText}>Image Picker</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={attachFile}
            >
              <Text style={styles.menuIcon}>📎</Text>
              <Text style={styles.menuText}>Attach File</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F1F5F9",
  },

  header: {
    height: 56,
    backgroundColor: "#0ea5a5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  logout: { color: "#fff", fontSize: 16 },

  bubbleRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },

  avatar: {
    width: 36,
    height: 36,
    backgroundColor: "#475569",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  bubble: { maxWidth: "75%", padding: 12, borderRadius: 16 },
  bubbleMine: { 
    backgroundColor: "#0ea5a5", 
    borderBottomRightRadius: 4,
  },
  bubbleOther: { 
    backgroundColor: "#fff", 
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  sender: { 
    fontSize: 11, 
    fontWeight: "700", 
    marginBottom: 4,
    opacity: 0.8,
  },
  msgText: { 
    fontSize: 15,
    lineHeight: 20,
  },
  msgImage: { width: 200, height: 200, marginTop: 6, borderRadius: 10 },

  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconButton: {
    marginRight: 8,
    padding: 4,
  },
  icon: { fontSize: 24 },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    fontSize: 15,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sendButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0ea5a5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0ea5a5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  send: { fontSize: 20, color: "#fff", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  attachMenu: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
});
