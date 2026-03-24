import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import StudentsScreen from './screens/StudentsScreen';
import WorksScreen from './screens/WorksScreen';
import ProgressScreen from './screens/ProgressScreen';
import ChartsScreen from './screens/ChartsScreen';
import { initializeDatabase } from './services/db';
import styles, { colors } from './styles';

const Tab = createBottomTabNavigator();

// Renderiza um "icone" simples usando emoji para cada aba.
const icon = (emoji, color) => <Text style={{ fontSize: 18, color }}>{emoji}</Text>;

export default function App() {
  useEffect(() => {
    // Garante que as tabelas do banco existam antes de o usuario navegar pelo app.
    initializeDatabase().catch((error) => {
      console.error('Database initialization error:', error);
    });
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      <NavigationContainer>
        <Tab.Navigator
          // Centraliza a configuracao visual usada em todas as abas inferiores.
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          }}
        >
          <Tab.Screen
            name="Students"
            component={StudentsScreen}
            options={{
              tabBarLabel: 'Alunos',
              tabBarIcon: ({ color }) => icon('👥', color),
            }}
          />
          <Tab.Screen
            name="Works"
            component={WorksScreen}
            options={{
              tabBarLabel: 'Trabalhos',
              tabBarIcon: ({ color }) => icon('📚', color),
            }}
          />
          <Tab.Screen
            name="Progress"
            component={ProgressScreen}
            options={{
              tabBarLabel: 'Andamento',
              tabBarIcon: ({ color }) => icon('⏱️', color),
            }}
          />
          <Tab.Screen
            name="Charts"
            component={ChartsScreen}
            options={{
              tabBarLabel: 'Gráfico',
              tabBarIcon: ({ color }) => icon('📊', color),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
