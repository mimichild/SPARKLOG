import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { RootStackParamList, MainTabParamList } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import HomeScreen from '@/screens/HomeScreen';
import EvaluationScreen from '@/screens/EvaluationScreen';
import CategoriesScreen from '@/screens/CategoriesScreen';
import RankingsScreen from '@/screens/RankingsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AddStoreScreen from '@/screens/AddStoreScreen';
import StoreDetailScreen from '@/screens/StoreDetailScreen';
import CategoryDetailScreen from '@/screens/CategoryDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { themeColor } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1e293b' },
        tabBarActiveTintColor: themeColor,
        tabBarInactiveTintColor: '#475569',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarLabel: '首頁', tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }} />
      <Tab.Screen name="Evaluation" component={EvaluationScreen}
        options={{ tabBarLabel: '評選', tabBarIcon: ({ color }) => <Text style={{ color }}>📝</Text> }} />
      <Tab.Screen name="Categories" component={CategoriesScreen}
        options={{ tabBarLabel: '分類', tabBarIcon: ({ color }) => <Text style={{ color }}>📂</Text> }} />
      <Tab.Screen name="Rankings" component={RankingsScreen}
        options={{ tabBarLabel: '排行', tabBarIcon: ({ color }) => <Text style={{ color }}>🏆</Text> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AddStore" component={AddStoreScreen}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
