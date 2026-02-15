import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ iconName, label, focused }) {
    return (
        <View style={styles.tabItem}>
            <Ionicons
                name={focused ? iconName : `${iconName}-outline`}
                size={focused ? 24 : 22}
                color={focused ? "#3B82F6" : "#64748B"}
            />
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
        </View>
    );
}

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const CONTENT_HEIGHT = 60;
    const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: "#0F172A",
                    borderTopWidth: 1,
                    borderTopColor: "#1E293B",
                    height: CONTENT_HEIGHT + bottomPadding,
                    paddingBottom: bottomPadding,
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon iconName="chatbubbles" label="Chats" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="calls"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon iconName="call" label="Calls" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="contacts"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon iconName="people" label="Contacts" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon iconName="settings" label="Settings" focused={focused} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabItem: { alignItems: "center", justifyContent: "center" },
    tabLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },
    tabLabelActive: { color: "#3B82F6", fontWeight: "700" },
});
