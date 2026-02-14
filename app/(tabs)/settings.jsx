import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, doc, getDoc, usersRef } from "../../firebase";

export default function Settings() {
    const router = useRouter();
    const [profile, setProfile] = useState({ username: "", email: "" });
    const insets = useSafeAreaInsets();

    useEffect(() => {
        (async () => {
            const uid = auth().currentUser?.uid;
            if (!uid) return;
            const snap = await getDoc(doc(usersRef, uid));
            if (snap.exists()) setProfile(snap.data());
        })();
    }, []);

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: () => {
                    (async () => {
                        try {
                            // sign out from firebase
                            await auth().signOut();

                            // Remove firebase-related persisted keys from AsyncStorage so auth state resets immediately
                            try {
                                const keys = await AsyncStorage.getAllKeys();
                                const firebaseKeys = keys.filter((k) => typeof k === 'string' && k.startsWith('firebase:'));
                                if (firebaseKeys.length) await AsyncStorage.multiRemove(firebaseKeys);
                            } catch (e2) {
                                // non-fatal: continue even if cleanup fails
                                console.warn('Failed clearing firebase keys from AsyncStorage', e2);
                            }
                        } catch (e) {
                            console.error('Logout failed', e);
                            Alert.alert('Error', 'Logout gagal. Coba lagi.');
                            return;
                        }
                        // on success, navigate to root/login
                        router.replace("/");
                    })();
                },
            },
        ]);
    };

    const initial = profile.username ? profile.username.charAt(0).toUpperCase() : "?";

    const menuSections = [
        {
            title: "ACCOUNT SETTINGS",
            items: [
                { icon: "person-outline", label: "Account", sub: "Profile, security, delete account" },
                { icon: "lock-closed-outline", label: "Privacy", sub: "Last seen, blocked contacts" },
            ],
        },
        {
            title: "PREFERENCES",
            items: [
                { icon: "notifications-outline", label: "Notifications", sub: "Message, group & call tones" },
                { icon: "cloud-download-outline", label: "Data and Storage", sub: "Network usage, auto-download" },
            ],
        },
        {
            title: "SUPPORT",
            items: [
                { icon: "help-circle-outline", label: "Help", sub: "FAQ, contact us" },
                { icon: "information-circle-outline", label: "About", sub: "App info, version" },
            ],
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: (insets.bottom || 0) + 88 }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>

                {/* Profile card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarRing}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.profileName}>{profile.username || "User"}</Text>
                    <Text style={styles.profileEmail}>@{profile.username?.toLowerCase().replace(/\s/g, "_") || "user"}</Text>
                </View>

                {/* Menu sections */}
                {menuSections.map((section, si) => (
                    <View key={si} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.items.map((item, ii) => (
                            <TouchableOpacity key={ii} style={styles.menuRow}>
                                <View style={styles.menuIconWrap}>
                                    <Ionicons name={item.icon} size={20} color="#3B82F6" />
                                </View>
                                <View style={styles.menuInfo}>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                    <Text style={styles.menuSub}>{item.sub}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#64748B" />
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FCA5A5" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Vibey v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    scroll: { paddingBottom: 40 },
    header: {
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },

    profileCard: { alignItems: "center", paddingVertical: 24 },
    avatarRing: { position: "relative", marginBottom: 12 },
    avatar: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: "#1E3A5F",
        justifyContent: "center", alignItems: "center",
        borderWidth: 3, borderColor: "#3B82F6",
    },
    avatarText: { color: "#3B82F6", fontSize: 36, fontWeight: "700" },
    onlineDot: {
        position: "absolute", bottom: 4, right: 4,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: "#22C55E", borderWidth: 3, borderColor: "#0F172A",
    },
    profileName: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 4 },
    profileEmail: { color: "#94A3B8", fontSize: 14 },

    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionTitle: { color: "#64748B", fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 12 },

    menuRow: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#1E293B", borderRadius: 14, padding: 16, marginBottom: 8,
    },
    menuIconWrap: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: "#0F172A",
        justifyContent: "center", alignItems: "center", marginRight: 14,
    },
    menuInfo: { flex: 1 },
    menuLabel: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
    menuSub: { color: "#94A3B8", fontSize: 12 },

    logoutBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: "#7F1D1D", marginHorizontal: 20, marginTop: 28,
        paddingVertical: 16, borderRadius: 14,
    },
    logoutText: { color: "#FCA5A5", fontSize: 16, fontWeight: "700" },

    version: { color: "#475569", fontSize: 12, textAlign: "center", marginTop: 16 },
});
