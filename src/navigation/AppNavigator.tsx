import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TestImageScreen from '../screens/TestImageScreen';
import SplashScreen from '../screens/SplashScreen';
import MainScreen from '../screens/MainScreen';

const Stack = createStackNavigator();

const AppNavigator = () => (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TestImage" component={TestImageScreen} />
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Main" component={MainScreen} />
        </Stack.Navigator>
    </NavigationContainer>
);

export default AppNavigator;