import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    auth,
    collection,
    db,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    usersRef,
    where,
} from "../../firebase";

export default function Contacts() {
    const router = useRouter();
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        const uid = auth().currentUser?.uid;
        if (!uid) return;

        // Load user's contacts sub-collection
        const contactsSnap = await getDocs(collection(db, "users", uid, "contacts"));
        const contactList = [];
        for (const d of contactsSnap.docs) {
            const userSnap = await getDoc(doc(usersRef, d.id));
            if (userSnap.exists()) {
                contactList.push({ id: d.id, ...userSnap.data() });
            }
        }
        setContacts(contactList);
    };

    const addContact = async () => {
        if (!search.trim()) return;
        const uid = auth().currentUser?.uid;

        // Search by email
        const q = query(usersRef, where("email", "==", search.trim().toLowerCase()));
        const snap = await getDocs(q);

        if (snap.empty) {
            Alert.alert("Not Found", "No user found with that email.");
            return;
        }

        const found = snap.docs[0];
        if (found.id === uid) {
            Alert.alert("Error", "You can't add yourself!");
            return;
        }

        // Save to contacts sub-collection
        await setDoc(doc(db, "users", uid, "contacts", found.id), {
            addedAt: new Date(),
        });

        setSearch("");
        loadContacts();
        Alert.alert("Success", `${found.data().username} added to contacts!`);
    };

    const startChat = async (contact) => {
        const uid = auth().currentUser?.uid;
        const mySnap = await getDoc(doc(usersRef, uid));
        const myName = mySnap.exists() ? mySnap.data().username : "Me";

        // Check if chat already exists between these two users
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", uid));
        const existingSnap = await getDocs(q);

        let chatId = null;
        existingSnap.forEach((d) => {
            const data = d.data();
            if (data.participants?.includes(contact.id)) {
                chatId = d.id;
            }
        });

        if (!chatId) {
            // Create new chat document
            const newChatRef = doc(chatsRef);
            chatId = newChatRef.id;
            await setDoc(newChatRef, {
                participants: [uid, contact.id],
                participantNames: { [uid]: myName, [contact.id]: contact.username },
                lastMessage: "",
                lastMessageTime: serverTimestamp(),
                unread: { [uid]: 0, [contact.id]: 0 },
            });
        }

        router.push({
            pathname: "/chat/[id]",
            params: { id: chatId, name: contact.username, otherUid: contact.id },
        });
    };

    const filtered = contacts.filter((c) =>
        c.username?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

        return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Contacts</Text>
            </View>

            {/* Search / Add */}
            <View style={styles.searchRow}>
                <View style={styles.searchWrap}>
                    <Ionicons name="search-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search or add by email..."
                        placeholderTextColor="#64748B"
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                        autoCapitalize="none"
                    />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={addContact}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {filtered.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="people-outline" size={48} color="#3B82F6" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyText}>No contacts yet</Text>
                    <Text style={styles.emptySubtext}>Search by email to add contacts</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.contactRow} onPress={() => startChat(item)}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.username?.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{item.username}</Text>
                                <Text style={styles.contactEmail}>{item.email}</Text>
                            </View>
                            <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },

    searchRow: {
        flexDirection: "row", paddingHorizontal: 20, marginBottom: 12, gap: 10,
    },
    searchWrap: {
        flex: 1, flexDirection: "row", alignItems: "center",
        backgroundColor: "#1E293B", borderRadius: 14, paddingHorizontal: 14, height: 48,
    },
    searchInput: { flex: 1, color: "#fff", fontSize: 14 },
    addBtn: {
        width: 48, height: 48, borderRadius: 14, backgroundColor: "#3B82F6",
        justifyContent: "center", alignItems: "center",
    },

    contactRow: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
    },
    avatar: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: "#1E3A5F",
        justifyContent: "center", alignItems: "center", marginRight: 14,
    },
    avatarText: { color: "#3B82F6", fontSize: 18, fontWeight: "700" },
    contactInfo: { flex: 1 },
    contactName: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 2 },
    contactEmail: { color: "#94A3B8", fontSize: 13 },

    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
    emptySubtext: { color: "#94A3B8", fontSize: 14, textAlign: "center" },
});
