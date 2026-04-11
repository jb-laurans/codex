// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
  screenOptions={{
    headerShown: false,
    tabBarStyle: {
      backgroundColor: '#0d0d14',
      borderTopColor: '#2a2a3a',
      borderTopWidth: 1,

      height: 60 + insets.bottom,   // 👈 CRUCIAL
      paddingBottom: insets.bottom, // 👈 CRUCIAL

      paddingTop: 6,
    },
    tabBarActiveTintColor: '#c9a84c',
    tabBarInactiveTintColor: '#5a5a6a',
    tabBarLabelStyle: {
      fontSize: 11,
      letterSpacing: 1,
      marginTop: 2,
    },
  }}
>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ENQUÊTE',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label="Enquête" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="carte"
        options={{
          title: 'CARTE',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗺️" label="Carte" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="carnet"
        options={{
          title: 'CARNET',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📖" label="Carnet" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
