import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

import { loadMessages, saveMessages } from "../utils/storage";

export default function Chat() {
  const router = useRouter();
  const flatRef = useRef(null);

  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const pickImage = async () => {
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

  const logout = async () => {
    await signOut(auth);
    router.replace("/");
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
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          />
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding" })}>
        <View style={styles.inputWrap}>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.icon}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            placeholder="Tulis pesan..."
            onChangeText={setText}
          />

          <TouchableOpacity onPress={sendText} disabled={sending}>
            <Text style={styles.send}>{sending ? "..." : "➤"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },

  header: {
    height: 70,
    backgroundColor: "#0ea5a5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  logout: { color: "#fff", fontSize: 16 },

  bubbleRow: { flexDirection: "row", marginBottom: 10 },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },

  avatar: {
    width: 34,
    height: 34,
    backgroundColor: "#1e293b",
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: { color: "#fff", fontWeight: "700" },

  bubble: { maxWidth: "75%", padding: 12, borderRadius: 14 },
  bubbleMine: { backgroundColor: "#0ea5a5", borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },

  sender: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  msgText: { fontSize: 15 },
  msgImage: { width: 200, height: 200, marginTop: 6, borderRadius: 10 },

  inputWrap: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: { fontSize: 24, marginHorizontal: 6 },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
  },
  send: { fontSize: 22, marginLeft: 10, color: "#0ea5a5" },
});
