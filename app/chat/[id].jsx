import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    addDoc,
    auth,
    collection,
    db,
    doc,
    getDownloadURL,
    onSnapshot,
    orderBy,
    query,
    ref,
    serverTimestamp,
    storage,
    updateDoc,
    uploadBytes,
} from "../../firebase";

export default function ChatRoom() {
    const { id, name, otherUid } = useLocalSearchParams();
    const router = useRouter();
    const flatRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    // Listen to messages in this chat
    useEffect(() => {
        if (!id) return;
        const msgsRef = collection(db, "chats", id, "messages");
        const q = query(msgsRef, orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            const arr = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toMillis?.() || Date.now(),
            }));
            setMessages(arr);
            setLoading(false);
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
        });
        return unsub;
    }, [id]);

    // Reset unread count when entering chat
    useEffect(() => {
        if (!id) return;
        const uid = auth().currentUser?.uid;
        if (!uid) return;
        const chatDocRef = doc(db, "chats", id);
        updateDoc(chatDocRef, { [`unread.${uid}`]: 0 }).catch(() => {});
    }, [id]);

    const sendText = async () => {
        if (!text.trim()) return;
        setSending(true);
        const uid = auth().currentUser?.uid;
        try {
            const msgsRef = collection(db, "chats", id, "messages");
            await addDoc(msgsRef, {
                text: text.trim(),
                senderId: uid,
                createdAt: serverTimestamp(),
            });
            // Update chat's last message
            const chatDocRef = doc(db, "chats", id);
            await updateDoc(chatDocRef, {
                lastMessage: text.trim(),
                lastMessageTime: serverTimestamp(),
                [`unread.${otherUid}`]: 1,
            });
            setText("");
        } finally {
            setSending(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
        });
        if (result.canceled) return;
        const img = result.assets[0];
        setSending(true);
        const uid = auth().currentUser?.uid;
        try {
            const blob = await (await fetch(img.uri)).blob();
            const imageRef = ref(storage, `chat_images/${Date.now()}.jpg`);
            await uploadBytes(imageRef, blob);
            const url = await getDownloadURL(imageRef);

            const msgsRef = collection(db, "chats", id, "messages");
            await addDoc(msgsRef, {
                image: url,
                senderId: uid,
                createdAt: serverTimestamp(),
            });
            const chatDocRef = doc(db, "chats", id);
            await updateDoc(chatDocRef, {
                lastMessage: "Photo",
                lastMessageTime: serverTimestamp(),
            });
        } finally {
            setSending(false);
        }
    };

    const formatTime = (ts) => {
        if (!ts) return "";
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const renderItem = ({ item }) => {
        const uid = auth().currentUser?.uid;
        const mine = item.senderId === uid;
        return (
            <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                {!mine && (
                    <View style={styles.msgAvatar}>
                        <Text style={styles.msgAvatarText}>{(name || "?").charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                    {item.text && <Text style={[styles.msgText, mine && { color: "#fff" }]}>{item.text}</Text>}
                    {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4, gap: 4 }}>
                        <Text style={[styles.msgTime, mine && { color: "rgba(255,255,255,0.6)" }]}>
                            {formatTime(item.createdAt)}
                        </Text>
                        {mine && <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.6)" />}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerAvatar}>
                    <Text style={styles.headerAvatarText}>{(name || "?").charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName} numberOfLines={1}>{name || "Chat"}</Text>
                    <Text style={styles.headerStatus}>Online</Text>
                </View>
                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="videocam-outline" size={22} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="call-outline" size={22} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <View style={{ flex: 1, paddingBottom: (insets.bottom || 0) + 88 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            ref={flatRef}
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={(i) => i.id}
                            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
                        />
                    )}
                </View>

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.input}
                            value={text}
                            placeholder="Type a message..."
                            placeholderTextColor="#64748B"
                            onChangeText={setText}
                            multiline
                        />
                    </View>
                    <TouchableOpacity style={styles.micBtn}>
                        <Ionicons name="mic-outline" size={22} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                        onPress={sendText}
                        disabled={sending || !text.trim()}
                    >
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },

    header: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#1E293B", paddingHorizontal: 12,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#334155",
    },
    backBtn: { padding: 8 },
    headerAvatar: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E3A5F",
        justifyContent: "center", alignItems: "center", marginRight: 10,
    },
    headerAvatarText: { color: "#3B82F6", fontSize: 18, fontWeight: "700" },
    headerInfo: { flex: 1 },
    headerName: { color: "#fff", fontSize: 17, fontWeight: "700" },
    headerStatus: { color: "#22C55E", fontSize: 12 },
    headerAction: { padding: 8 },

    bubbleRow: { flexDirection: "row", marginBottom: 8, alignItems: "flex-end" },
    left: { justifyContent: "flex-start" },
    right: { justifyContent: "flex-end" },
    msgAvatar: {
        width: 30, height: 30, borderRadius: 15, backgroundColor: "#334155",
        justifyContent: "center", alignItems: "center", marginRight: 8,
    },
    msgAvatarText: { color: "#94A3B8", fontSize: 12, fontWeight: "700" },
    bubble: { maxWidth: "75%", padding: 12, borderRadius: 18 },
    bubbleMine: { backgroundColor: "#3B82F6", borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: "#1E293B", borderBottomLeftRadius: 4 },
    msgText: { color: "#E2E8F0", fontSize: 15, lineHeight: 21 },
    msgImage: { width: 200, height: 200, borderRadius: 12, marginTop: 4 },
    msgTime: { fontSize: 10, color: "#64748B" },

    inputBar: {
        flexDirection: "row", alignItems: "flex-end",
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: "#1E293B", borderTopWidth: 1, borderTopColor: "#334155",
    },
    attachBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: "#334155",
        justifyContent: "center", alignItems: "center", marginRight: 8,
    },
    inputWrap: {
        flex: 1, backgroundColor: "#0F172A", borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100,
        justifyContent: "center",
    },
    input: { color: "#fff", fontSize: 15, maxHeight: 80 },
    micBtn: { padding: 8 },
    sendBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: "#3B82F6",
        justifyContent: "center", alignItems: "center", marginLeft: 4,
    },
    sendBtnDisabled: { opacity: 0.4 },
});
