import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  auth,
  collection,
  db,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  usersRef,
  where
} from "../../firebase";

export default function HomeChats() {
    const router = useRouter();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const uid = auth().currentUser?.uid;
        if (!uid) return;

        // Get current user's name
        (async () => {
            const snap = await getDoc(doc(usersRef, uid));
            if (snap.exists()) setUsername(snap.data().username);
        })();

        // Listen to chats where the user is a participant
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", uid), orderBy("lastMessageTime", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setChats(arr);
            setLoading(false);
        }, () => setLoading(false));

        return unsub;
    }, []);

    const openChat = (chat) => {
        const uid = auth().currentUser?.uid;
        const otherUid = chat.participants?.find((p) => p !== uid) || "";
        router.push({
            pathname: "/chat/[id]",
            params: { id: chat.id, name: chat.participantNames?.[otherUid] || "Chat", otherUid },
        });
    };

    const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");
    const formatTime = (ts) => {
        if (!ts) return "";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const now = new Date();
        const diff = now - d;
        if (diff < 86400000) {
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        if (diff < 172800000) return "Yesterday";
        return d.toLocaleDateString([], { weekday: "short" });
    };

    const renderChat = ({ item }) => {
        const uid = auth().currentUser?.uid;
        const otherUid = item.participants?.find((p) => p !== uid) || "";
        const name = item.participantNames?.[otherUid] || "Unknown";
        return (
            <TouchableOpacity style={styles.chatRow} onPress={() => openChat(item)}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitial(name)}</Text>
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatTop}>
                        <Text style={styles.chatName} numberOfLines={1}>{name}</Text>
                        <Text style={styles.chatTime}>{formatTime(item.lastMessageTime)}</Text>
                    </View>
                    <Text style={styles.chatMsg} numberOfLines={1}>
                        {item.lastMessage || "Start a conversation"}
                    </Text>
                </View>
                {item.unread?.[uid] > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.unread[uid]}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerLogo}>
                        <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.headerTitle}>Vibey</Text>
                </View>
                <View style={styles.headerRight}>
                    <Ionicons name="search-outline" size={22} color="#94A3B8" />
                    <Ionicons name="ellipsis-vertical" size={22} color="#94A3B8" />
                </View>
            </View>

            {/* Recent Chats label */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>RECENT CHATS</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : chats.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#3B82F6" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyText}>No chats yet</Text>
                    <Text style={styles.emptySubtext}>Go to Contacts to start a conversation!</Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderChat}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 88 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    },
    headerLeft: { flexDirection: "row", alignItems: "center" },
    headerLogo: {
        width: 38, height: 38, borderRadius: 10, backgroundColor: "#1E3A5F",
        justifyContent: "center", alignItems: "center", marginRight: 10,
    },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
    headerRight: { flexDirection: "row", gap: 16 },

    sectionRow: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, marginBottom: 8,
    },
    sectionTitle: { color: "#64748B", fontSize: 12, fontWeight: "700", letterSpacing: 1 },

    chatRow: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: "#1E3A5F",
        justifyContent: "center", alignItems: "center", marginRight: 14,
    },
    avatarText: { color: "#3B82F6", fontSize: 20, fontWeight: "700" },
    chatInfo: { flex: 1 },
    chatTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    chatName: { color: "#fff", fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
    chatTime: { color: "#3B82F6", fontSize: 12 },
    chatMsg: { color: "#94A3B8", fontSize: 13 },
    badge: {
        backgroundColor: "#3B82F6", borderRadius: 12, minWidth: 24, height: 24,
        justifyContent: "center", alignItems: "center", paddingHorizontal: 6, marginLeft: 8,
    },
    badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
    emptySubtext: { color: "#94A3B8", fontSize: 14, textAlign: "center" },
});
