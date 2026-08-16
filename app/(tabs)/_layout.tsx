import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#215C48', tabBarInactiveTintColor: '#8A918D', tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E7E5DE', height: 86, paddingTop: 8 }, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' } }}>
      <Tabs.Screen name="index" options={{ title: 'Reset', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Progress', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={23} color={color} /> }} />
    </Tabs>
  );
}
