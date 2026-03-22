import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as DbService from './services/dbservice';
import StudentsScreen from './screens/StudentsScreen';
import WorksScreen from './screens/WorksScreen';
import ProgressScreen from './screens/ProgressScreen';
import { colors } from './styles';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    // Inicializar banco de dados
    const initializeDB = async () => {
      try {
        await DbService.createTable();
        console.log('Banco de dados inicializado com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
      }
    };
    initializeDB();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.primary,
              borderTopWidth: 1,
              paddingBottom: 5,
              paddingTop: 5,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              marginTop: -5,
            },
          }}
        >
          <Tab.Screen
            name="Alunos"
            component={StudentsScreen}
            options={{
              tabBarLabel: 'Alunos',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 20, color }}>👥</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Trabalhos"
            component={WorksScreen}
            options={{
              tabBarLabel: 'Trabalhos',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 20, color }}>📋</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Progresso"
            component={ProgressScreen}
            options={{
              tabBarLabel: 'Progresso',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 20, color }}>⏳</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

import { Text } from 'react-native';

