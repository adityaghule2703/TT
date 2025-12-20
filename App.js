import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from '@expo/vector-icons';

// ---------------------------
//        AUTH SCREENS
// ---------------------------
import Login from "./auth/Login";
import ChooseRole from "./auth/ChooseRole";
import MobileVerify from "./auth/MobileVerify";
import MobileVerifyOtp from "./auth/MobileVerifyOtp";
import Register from "./auth/Register";
import ForgotPassword from "./auth/ForgotPassword";
import ForgotPasswordVerify from "./auth/ForgotPasswordVerify";
import ResetPassword from "./auth/ResetPassword";

// ---------------------------
//        USER SCREENS
// ---------------------------
import Home from "./pages/Home";
import About from "./pages/About";
import Game from "./pages/Game";
import Profile from "./pages/Profile";
import Faqs from "./pages/Faqs";
import GameDetails from "./pages/GameDetails";
import TicketsScreen from "./pages/TicketsScreen";

// ---------------------------
//        HOST SCREENS
// ---------------------------
import HostProfile from "./pages/HostProfile";
import HostDashboard from "./pages/HostDashboard";
import HostFaqs from "./pages/HostFaqs";
import HostGame from "./pages/HostGame";
import HostSubscription from "./pages/HostSubscription";
import HostGamePatterns from "./pages/HostGamePatterns";
import HostGameCreation from "./pages/HostGameCreation";
import HostGameEdit from "./pages/HostGameEdit";
import HostTicketRequests from "./pages/HostTicketRequests";
import HostGameUsers from "./pages/HostGameUsers";
import TicketRequestsScreen from "./pages/TicketRequestsScreen";
import HostGameRoom from "./pages/HostGameRoom";
import HostCalledNumbers from "./pages/HostCalledNumbers";
import UserGameRoom from "./pages/UserGameRoom";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------------
//        USER TABS COMPONENT
// ---------------------------
function UserTabs({ onLogout }) {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'About') {
            iconName = 'info-circle';
          } else if (route.name === 'Game') {
            iconName = 'gamepad';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          } else if (route.name === 'Faqs') {
            iconName = 'question-circle';
          }
          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF7675',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 2,
        },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: 5 + insets.bottom,
          paddingTop: 5,
        },
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
//        HOST TABS COMPONENT
// ---------------------------
function HostTabs({ onLogout }) {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'HostDashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'HostGame') {
            iconName = 'gamepad';
          } else if (route.name === 'HostSubscription') {
            iconName = 'credit-card';
          } else if (route.name === 'HostFaqs') {
            iconName = 'question-circle';
          } else if (route.name === 'HostProfile') {
            iconName = 'user';
          }
          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 2,
        },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: 5 + insets.bottom,
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen 
        name="HostDashboard" 
        options={{ tabBarLabel: 'Dashboard' }}
      >
        {(props) => <HostDashboard {...props} onLogout={onLogout} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="HostGame" 
        options={{ tabBarLabel: 'Games' }}
      >
        {(props) => <HostGame {...props} onLogout={onLogout} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="HostSubscription" 
        options={{ tabBarLabel: 'Subscription' }}
      >
        {(props) => <HostSubscription {...props} onLogout={onLogout} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="HostFaqs" 
        options={{ tabBarLabel: 'FAQs' }}
      >
        {(props) => <HostFaqs {...props} onLogout={onLogout} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="HostProfile" 
        options={{ tabBarLabel: 'Profile' }}
      >
        {(props) => <HostProfile {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ---------------------------
//        MAIN APP
// ---------------------------
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const role = await AsyncStorage.getItem("userRole");
      
      if (token && role) {
        if (role === "user") {
          const userToken = await AsyncStorage.getItem("userToken");
          setLoggedIn(!!userToken);
        } else if (role === "host") {
          const hostToken = await AsyncStorage.getItem("hostToken");
          setLoggedIn(!!hostToken);
        } else {
          setLoggedIn(!!token);
        }
      } else {
        setLoggedIn(false);
      }
      
      setUserRole(role);
    } catch (error) {
      console.log("Check login error:", error);
      setLoggedIn(false);
      setUserRole(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all storage
      await AsyncStorage.multiRemove([
        "token",
        "userToken",
        "hostToken",
        "user",
        "host",
        "userData",
        "userRole"
      ]);
      setLoggedIn(false);
      setUserRole(null);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleLoginSuccess = async () => {
    const role = await AsyncStorage.getItem("userRole");
    setLoggedIn(true);
    setUserRole(role);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {loggedIn ? (
              <>
                {/* MAIN APP WITH ROLE-BASED TABS */}
                {userRole === "user" ? (
                  // USER TABS (Home, About, Game, Profile, Faqs)
                  <Stack.Screen name="UserTabs">
                    {(props) => (
                      <UserTabs {...props} onLogout={handleLogout} />
                    )}
                  </Stack.Screen>
                ) : (
                  // HOST TABS (Dashboard, Games, Subscription, FAQs, Profile)
                  <Stack.Screen name="HostTabs">
                    {(props) => (
                      <HostTabs {...props} onLogout={handleLogout} />
                    )}
                  </Stack.Screen>
                )}

                {/* USER-ONLY SCREENS */}
                {userRole === "user" && (
                  <>
                    <Stack.Screen name="GameDetails" component={GameDetails} />
                    <Stack.Screen name="TicketsScreen" component={TicketsScreen} />
                    <Stack.Screen name="TicketRequestsScreen" component={TicketRequestsScreen}/>
                    <Stack.Screen name="UserGameRoom" component={UserGameRoom} />
                  </>
                )}

                {userRole === "host" && (
                  <>
                    <Stack.Screen name="HostGamePatterns" component={HostGamePatterns} />
                    <Stack.Screen name="HostGameCreation" component={HostGameCreation} />
                    <Stack.Screen name="HostGameEdit" component={HostGameEdit} />
                    <Stack.Screen name="HostTicketRequests" component={HostTicketRequests} />
                    <Stack.Screen name="HostGameUsers" component={HostGameUsers} />
                    <Stack.Screen name="HostGameRoom" component={HostGameRoom} />
                    <Stack.Screen name="HostCalledNumbers" component={HostCalledNumbers} />
                  </>
                )}

                {/* HOST-ONLY SCREENS (Stack screens for host) */}
                {/* Add any stack screens that hosts need here */}
              </>
            ) : (
              <>
                {/* AUTH SCREENS */}
                <Stack.Screen name="Login">
                  {(props) => (
                    <Login {...props} onLoginSuccess={handleLoginSuccess} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="ChooseRole" component={ChooseRole} />
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