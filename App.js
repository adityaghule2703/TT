import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';


// ---------------------------
//        AUTH SCREENS
// ---------------------------
import Login from "./auth/Login";
import MobileVerify from "./auth/MobileVerify";
import MobileVerifyOtp from "./auth/MobileVerifyOtp";
import Register from "./auth/Register";
import ForgotPassword from "./auth/ForgotPassword";
import ForgotPasswordVerify from "./auth/ForgotPasswordVerify";
import ResetPassword from "./auth/ResetPassword";

// ---------------------------
//        APP SCREENS
// ---------------------------
import Home from "./pages/Home";
import About from "./pages/About";
import Game from "./pages/Game";
import Profile from "./pages/Profile";
import Faqs from "./pages/Faqs";
import GameDetails from "./pages/GameDetails";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------------
//        APP TABS COMPONENT
// ---------------------------
function AppTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home'; // FontAwesome
            return <FontAwesome name={iconName} size={size} color={color} />;
          } else if (route.name === 'About') {
            iconName = 'info-circle';
            return <FontAwesome name={iconName} size={size} color={color} />;
          } else if (route.name === 'Game') {
            iconName = 'gamepad';
            return <FontAwesome name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            iconName = 'user';
            return <FontAwesome name={iconName} size={size} color={color} />;
          } else if (route.name === 'Faqs') {
            iconName = 'question-circle';
            return <FontAwesome name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#FF7675',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="About" component={About} />
      <Tab.Screen name="Game" component={Game} />
      <Tab.Screen name="Profile">
        {(props) => <Profile {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Faqs" component={Faqs} />
    </Tab.Navigator>
  );
}


// ---------------------------
//        MAIN APP
// ---------------------------
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("token");
    setLoggedIn(!!token);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>

            {loggedIn ? (
  <>
    {/* MAIN APP WITH TABS */}
    <Stack.Screen name="AppTabs">
      {(props) => (
        <AppTabs {...props} onLogout={() => setLoggedIn(false)} />
      )}
    </Stack.Screen>

    {/* GAME DETAILS PAGE */}
    <Stack.Screen name="GameDetails" component={GameDetails} />
  </>
) : (
  <>
    {/* AUTH SCREENS */}
    <Stack.Screen name="Login">
      {(props) => (
        <Login {...props} onLoginSuccess={() => setLoggedIn(true)} />
      )}
    </Stack.Screen>
    <Stack.Screen name="MobileVerify" component={MobileVerify} />
    <Stack.Screen name="MobileVerifyOtp" component={MobileVerifyOtp} />
    <Stack.Screen name="Register" component={Register} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    <Stack.Screen name="ForgotPasswordVerify" component={ForgotPasswordVerify} />
    <Stack.Screen name="ResetPassword" component={ResetPassword} />
  </>
)}


          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
