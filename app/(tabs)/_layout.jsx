import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
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
    const BASE_TABBAR_HEIGHT = 70;
    const tabBarStyle = {
        ...styles.tabBar,
        height: BASE_TABBAR_HEIGHT + (insets.bottom || 0),
        paddingBottom: (insets.bottom || 0) + 8,
        // floating, rounded look
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: (insets.bottom || 0) ? 12 : 12,
        borderRadius: 16,
        backgroundColor: '#071025',
        // shadow (iOS)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        // elevation (Android)
        elevation: 12,
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle,
                tabBarShowLabel: false,
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
    tabBar: {
        backgroundColor: "transparent",
        borderTopWidth: 0,
        height: 70,
        paddingBottom: 8,
        paddingTop: 8,
    },
    tabItem: { alignItems: "center", justifyContent: "center" },
    tabLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },
    tabLabelActive: { color: "#3B82F6", fontWeight: "700" },
});
