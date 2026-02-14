import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, collection, db, onSnapshot, orderBy, query, where } from "../../firebase";

export default function Calls() {
    const [calls, setCalls] = useState([]);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const uid = auth().currentUser?.uid;
        if (!uid) return;

        const callsRef = collection(db, "calls");
        const q = query(callsRef, where("participants", "array-contains", uid), orderBy("time", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setCalls(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, () => {});

        return unsub;
    }, []);

    const formatTime = (ts) => {
        if (!ts) return "";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
            " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const renderCall = ({ item }) => {
        const uid = auth().currentUser?.uid;
        const isIncoming = item.to === uid;
        const name = item.callerName || "Unknown";
        return (
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons
                            name={isIncoming ? "arrow-down-circle" : "arrow-up-circle"}
                            size={14}
                            color={isIncoming ? "#22C55E" : "#3B82F6"}
                        />
                        <Text style={styles.meta}>
                            {isIncoming ? "Incoming" : "Outgoing"} {" • "}
                        </Text>
                        <Ionicons
                            name={item.type === "video" ? "videocam" : "call"}
                            size={14}
                            color="#94A3B8"
                        />
                        <Text style={styles.meta}>
                            {item.type === "video" ? "Video" : "Voice"}
                        </Text>
                    </View>
                </View>
                <Text style={styles.time}>{formatTime(item.time)}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Calls</Text>
            </View>

            {calls.length === 0 ? 
                (<View style={styles.emptyWrap}>
                    <Ionicons name="call-outline" size={48} color="#3B82F6" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyText}>No recent calls</Text>
                    <Text style={styles.emptySubtext}>Your call history will appear here</Text>
                </View>) 
            : 
                (<FlatList
                    data={calls}
                    renderItem={renderCall}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 88 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },

    row: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
    },
    avatar: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: "#1E3A5F",
        justifyContent: "center", alignItems: "center", marginRight: 14,
    },
    avatarText: { color: "#3B82F6", fontSize: 18, fontWeight: "700" },
    info: { flex: 1 },
    name: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 2 },
    meta: { color: "#94A3B8", fontSize: 13 },
    time: { color: "#64748B", fontSize: 12 },

    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
    emptySubtext: { color: "#94A3B8", fontSize: 14, textAlign: "center" },
});
