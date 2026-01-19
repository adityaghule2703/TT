import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  SafeAreaView,
  Animated,
  RefreshControl,
  Dimensions,
  Easing,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get('window');
const BASE_URL = "https://exilance.com/tambolatimez/public/";

const Profile = ({ onLogout, navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Helper function to get full image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return BASE_URL + cleanPath;
  };

  useEffect(() => {
    fetchProfile();
    requestPermissions();
    fetchNotifications();
    
    // Start animations
    startAnimations();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const startAnimations = () => {
    // First floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Second floating animation (different timing)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // Interpolations for animations
  const translateY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15]
  });

  const translateY2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll permissions to upload profile images!",
        [{ text: "OK" }]
      );
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProfile();
    fetchNotifications();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}api/user/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.user) {
        setUser(res.data.user);
        setFormData({
          name: res.data.user.name || "",
        });
        
        if (res.data.user.profile_image_url) {
          setImageUri(res.data.user.profile_image_url);
        } else if (res.data.user.profile_image) {
          setImageUri(getFullImageUrl(res.data.user.profile_image));
        }
      }
    } catch (error) {
      console.log("Fetch profile error:", error);
      Alert.alert("Error", "Failed to fetch profile information");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(
        `${BASE_URL}api/user/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status) {
        setNotifications(res.data.data || []);
      }
    } catch (error) {
      console.log("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const openNotificationModal = () => {
    setNotificationModalVisible(true);
  };

  const handleImagePick = async (source) => {
    setImageModalVisible(false);
    
    let result;
    try {
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const updateProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Name is required", [{ text: "OK" }]);
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const formDataToSend = new FormData();

      // Only send name (email and mobile are not editable)
      formDataToSend.append("name", formData.name);

      if (imageUri && 
          !imageUri.startsWith(BASE_URL) && 
          !imageUri.startsWith('http') &&
          (imageUri.startsWith('file://') || imageUri.startsWith('content://'))) {
        const localUri = imageUri;
        const filename = localUri.split('/').pop();
        
        let type = 'image/jpeg';
        if (filename) {
          const match = /\.(\w+)$/.exec(filename);
          if (match) {
            type = `image/${match[1]}`;
          }
        }

        formDataToSend.append('profile_image', {
          uri: localUri,
          name: filename || `profile_${Date.now()}.jpg`,
          type,
        });
      }

      const response = await axios.post(
        `${BASE_URL}api/user/profile`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.user) {
        setUser(response.data.user);
        Alert.alert("Success", "Profile updated successfully!");
        setEditMode(false);
        
        if (response.data.user.profile_image_url) {
          setImageUri(response.data.user.profile_image_url);
        } else if (response.data.user.profile_image) {
          setImageUri(getFullImageUrl(response.data.user.profile_image));
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.log("Update error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const logoutUser = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: performLogout }
      ]
    );
  };

  const performLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      await axios.post(
        `${BASE_URL}api/user/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      Alert.alert("Success", "You have been logged out successfully.");
      onLogout();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNavigation = (screenName) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screenName);
    } else {
      console.warn(`Navigation not available. Attempted to navigate to: ${screenName}`);
      Alert.alert("Info", `${screenName} page will open here`);
    }
  };

  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <Ionicons name="notifications" size={20} color="#4A90E2" />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title || "New Update"}</Text>
        <Text style={styles.notificationMessage}>
          {item.message || "Check out the new features!"}
        </Text>
        <Text style={styles.notificationDate}>
          {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* BACKGROUND PATTERNS - Matching Home design */}
        <View style={styles.backgroundPattern}>
          {/* Animated floating clouds */}
          <Animated.View 
            style={[
              styles.cloud1, 
              { 
                transform: [
                  { translateY: translateY1 },
                  { translateX: translateY2 }
                ] 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.cloud2, 
              { 
                transform: [
                  { translateY: translateY2 },
                  { translateX: translateY1 }
                ] 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.cloud3, 
              { 
                transform: [
                  { translateY: translateY1 },
                  { translateX: translateY2 }
                ] 
              }
            ]} 
          />
          
          {/* Sun */}
          <Animated.View 
            style={[
              styles.sun,
              { 
                transform: [{ rotate: rotate }],
                opacity: pulseAnim
              }
            ]} 
          />
          
          {/* Sky gradient overlay */}
          <View style={styles.skyGradient} />
          
          {/* Bird silhouettes */}
          <Animated.View 
            style={[
              styles.bird1,
              { transform: [{ translateX: floatAnim1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50]
              }) }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.bird2,
              { transform: [{ translateX: floatAnim2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -30]
              }) }] }
            ]} 
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4A90E2"
              colors={['#4A90E2']}
            />
          }
        >
          {/* HEADER - Sky Blue Background */}
          <Animated.View 
            style={[
              styles.header,
              { 
                transform: [{ scale: pulseAnim }],
              }
            ]}
          >
            <View style={styles.headerPattern}>
              <View style={styles.headerCloud1} />
              <View style={styles.headerCloud2} />
              <View style={styles.headerCloud3} />
              
              {/* Sun rays in header */}
              <Animated.View 
                style={[
                  styles.sunRay1,
                  { transform: [{ rotate: rotate }] }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.sunRay2,
                  { transform: [{ rotate: rotate }] }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.sunRay3,
                  { transform: [{ rotate: rotate }] }
                ]} 
              />
            </View>

            <View style={styles.headerContent}>
              <View style={styles.headerTopRow}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity
                  style={styles.notificationButton}
                  onPress={openNotificationModal}
                >
                  <Ionicons name="notifications-outline" size={24} color="#FFF" />
                  {notifications.length > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {notifications.length > 99 ? '99+' : notifications.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.headerSubtitle}>Manage your account settings</Text>
            </View>
          </Animated.View>

          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <View style={styles.profilePattern}>
              <View style={styles.profilePatternCircle} />
              <View style={styles.profilePatternDots} />
            </View>
            
            <View style={styles.profileHeader}>
              <TouchableOpacity
                onPress={() => editMode && setImageModalVisible(true)}
                disabled={!editMode}
                style={styles.imageContainer}
              >
                <Image
                  source={{
                    uri: imageUri
                      ? imageUri
                      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop",
                  }}
                  style={[
                    styles.profileImage,
                    editMode && styles.profileImageEdit,
                  ]}
                  onError={() => setImageUri(null)}
                />
                {editMode && (
                  <View style={styles.editImageBadge}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              {editMode ? (
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={formData.name}
                    onChangeText={(text) => handleInputChange("name", text)}
                    placeholder="Enter your name"
                    placeholderTextColor="#4682B4"
                  />
                </View>
              ) : (
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
                  <Text style={styles.userRole}>Premium Member</Text>
                </View>
              )}

              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={[styles.editButton, editMode && styles.saveButton]}
                  onPress={() => {
                    animateButton();
                    if (editMode) {
                      updateProfile();
                    } else {
                      setEditMode(true);
                    }
                  }}
                  disabled={saving}
                >
                  <View style={styles.glassEffectOverlay} />
                  <Ionicons 
                    name={editMode ? "checkmark" : "pencil"} 
                    size={18} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.editButtonText}>
                    {saving ? "Saving..." : editMode ? "Save" : "Edit Profile"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {editMode && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditMode(false);
                    setFormData({
                      name: user?.name || "",
                    });
                    if (user?.profile_image_url) {
                      setImageUri(user.profile_image_url);
                    } else if (user?.profile_image) {
                      setImageUri(getFullImageUrl(user.profile_image));
                    } else {
                      setImageUri(null);
                    }
                  }}
                >
                  <Ionicons name="close" size={18} color="#4682B4" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ACCOUNT INFORMATION - Email and Mobile are READ ONLY */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={22} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Account Information</Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoPattern} />
              
              {/* Email - Always Read Only */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail" size={16} color="#4A90E2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
                </View>
              </View>
              
              {/* Mobile - Always Read Only */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="phone-portrait" size={16} color="#4A90E2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mobile Number</Text>
                  <Text style={styles.infoValue}>{user?.mobile || "N/A"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* REFERRAL & STATS */}
          {!editMode && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart" size={22} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Stats & Referral</Text>
              </View>
              
              <View style={styles.statsCard}>
                <View style={styles.statsPattern} />
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="gift" size={20} color="#FF6B35" />
                    </View>
                    <Text style={styles.statLabel}>Referral Code</Text>
                    <Text style={styles.statValue}>{user?.referral_code || "N/A"}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="star" size={20} color="#FFD700" />
                    </View>
                    <Text style={styles.statLabel}>Referral Points</Text>
                    <Text style={styles.statValue}>{user?.referral_points || "0"}</Text>
                  </View>
                </View>
                
                <View style={styles.additionalInfo}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="shield-checkmark" size={16} color="#4A90E2" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Account Status</Text>
                      <Text style={styles.statusValue}>Active</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="people" size={16} color="#4A90E2" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Under Referral</Text>
                      <Text style={styles.infoValue}>{user?.under_referral || "N/A"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* SETTINGS OPTIONS */}
          {!editMode && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings" size={22} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Settings</Text>
              </View>
              
              <View style={styles.optionsCard}>
                {[
                  { 
                    icon: "ticket", 
                    title: "My Tickets", 
                    color: "#4A90E2",
                    onPress: () => handleNavigation('Game')
                  },
                  { 
                    icon: "notifications", 
                    title: "Notifications", 
                    color: "#5DADE2",
                    onPress: openNotificationModal
                  },
                  { 
                    icon: "lock-closed", 
                    title: "Privacy & Security", 
                    color: "#7EC8E3",
                    onPress: () => Alert.alert("Coming Soon", "Privacy & Security settings will be available soon!")
                  },
                  { 
                    icon: "help-circle", 
                    title: "Help & Support", 
                    color: "#4682B4",
                    onPress: () => Alert.alert("Help & Support", "Contact support@example.com for assistance")
                  },
                ].map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.optionItem}
                    onPress={item.onPress}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: `${item.color}15` }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{item.title}</Text>
                      <Text style={styles.optionDescription}>
                        {index === 0 ? "View your game tickets" :
                         index === 1 ? "View all notifications" :
                         index === 2 ? "Security settings" : "Get help & support"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#4682B4" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* LOGOUT BUTTON */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={logoutUser}
          >
            <View style={styles.glassEffectOverlay} />
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* BOTTOM SPACE */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </Animated.View>

      {/* IMAGE SELECTION MODAL */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalPattern} />
            
            <Text style={styles.modalTitle}>Update Profile Picture</Text>
            <Text style={styles.modalSubtitle}>Choose how you want to update your profile picture</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImagePick("camera")}
            >
              <View style={styles.modalOptionIcon}>
                <Ionicons name="camera" size={24} color="#4A90E2" />
              </View>
              <View style={styles.modalOptionContent}>
                <Text style={styles.modalOptionTitle}>Take Photo</Text>
                <Text style={styles.modalOptionDescription}>Use your camera to take a new photo</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImagePick("gallery")}
            >
              <View style={styles.modalOptionIcon}>
                <Ionicons name="images" size={24} color="#4A90E2" />
              </View>
              <View style={styles.modalOptionContent}>
                <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.modalOptionDescription}>Select a photo from your gallery</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NOTIFICATION MODAL */}
      <Modal
        visible={notificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.notificationModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4682B4" />
              </TouchableOpacity>
            </View>

            {loadingNotifications ? (
              <View style={styles.loadingContainerModal}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingTextModal}>Loading notifications...</Text>
              </View>
            ) : notifications.length > 0 ? (
              <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-off" size={50} color="#E3F2FD" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-off" size={50} color="#E3F2FD" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setNotificationModalVisible(false)}
            >
              <View style={styles.glassEffectOverlay} />
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#4682B4",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  // Background Patterns matching Home
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  cloud1: {
    position: 'absolute',
    top: 40,
    left: width * 0.1,
    width: 100,
    height: 40,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cloud2: {
    position: 'absolute',
    top: 80,
    right: width * 0.15,
    width: 80,
    height: 30,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cloud3: {
    position: 'absolute',
    top: 120,
    left: width * 0.6,
    width: 60,
    height: 25,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sun: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  skyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
  },
  bird1: {
    position: 'absolute',
    top: 150,
    left: 50,
    width: 20,
    height: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ rotate: '-30deg' }],
  },
  bird2: {
    position: 'absolute',
    top: 180,
    right: 70,
    width: 15,
    height: 15,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ rotate: '30deg' }],
  },
  // Header
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#5DADE2",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerCloud1: {
    position: 'absolute',
    top: 20,
    left: 30,
    width: 80,
    height: 30,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerCloud2: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 60,
    height: 20,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerCloud3: {
    position: 'absolute',
    bottom: 30,
    left: width * 0.4,
    width: 40,
    height: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sunRay1: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '0deg' }],
  },
  sunRay2: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '45deg' }],
  },
  sunRay3: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '90deg' }],
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5DADE2",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#5DADE2",
    fontSize: 10,
    fontWeight: "700",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    position: 'relative',
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profilePattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    overflow: 'hidden',
    zIndex: 1,
  },
  profilePatternCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  profilePatternDots: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 15,
  },
  profileHeader: {
    alignItems: "center",
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#F8F9FA",
  },
  profileImageEdit: {
    borderWidth: 3,
    borderColor: "#4A90E2",
  },
  editImageBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#4A90E2",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nameContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
    textAlign: "center",
  },
  userRole: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "600",
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nameInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#4A90E2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  glassEffectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: "#28A745",
    shadowColor: "#28A745",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
  },
  cancelButtonText: {
    color: "#4682B4",
    fontWeight: "500",
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4682B4",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 60,
    height: 60,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.02)',
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74, 144, 226, 0.1)",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#4682B4",
    marginBottom: 2,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#28A745",
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.03)',
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  statLabel: {
    fontSize: 12,
    color: "#4682B4",
    marginBottom: 4,
    fontWeight: "500",
    textAlign: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    textAlign: "center",
  },
  additionalInfo: {
    marginTop: 8,
  },
  optionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74, 144, 226, 0.1)",
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4682B4",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: "#4682B4",
    opacity: 0.7,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC3545",
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#DC3545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  logoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomSpace: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  notificationModalContent: {
    width: "90%",
    height: "70%",
    maxWidth: "none",
  },
  modalPattern: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4682B4",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#4682B4",
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.7,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4682B4",
    marginBottom: 2,
  },
  modalOptionDescription: {
    fontSize: 12,
    color: "#4682B4",
    opacity: 0.7,
  },
  modalCancelButton: {
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
    marginTop: 8,
  },
  modalCancelText: {
    color: "#4682B4",
    fontWeight: "600",
    fontSize: 15,
  },
  // Notification Modal Styles
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74, 144, 226, 0.1)",
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4682B4",
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#4A90E2",
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: "#4682B4",
    opacity: 0.7,
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#4682B4",
    opacity: 0.7,
    marginTop: 10,
  },
  loadingContainerModal: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingTextModal: {
    marginTop: 10,
    fontSize: 14,
    color: "#4682B4",
  },
  closeBtn: {
    backgroundColor: "#4A90E2",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});