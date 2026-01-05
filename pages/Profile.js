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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get('window');
const BASE_URL = "https://exilance.com/tambolatimez/public/";

const Profile = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
          email: res.data.user.email || "",
          mobile: res.data.user.mobile || "",
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

      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobile", formData.mobile);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPatterns}>
          <View style={styles.loadingPatternCircle} />
          <View style={styles.loadingPatternDots} />
        </View>
        <ActivityIndicator size="large" color="#40E0D0" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* BACKGROUND PATTERNS */}
        <View style={styles.backgroundPatterns}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
          <View style={styles.patternCircle3} />
          <View style={styles.patternCircle4} />
          <View style={styles.geometricPattern1} />
          <View style={styles.geometricPattern2} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#40E0D0"
              colors={['#40E0D0']}
            />
          }
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account settings</Text>
          </View>

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
                    placeholderTextColor="#ADB5BD"
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
                      email: user?.email || "",
                      mobile: user?.mobile || "",
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
                  <Ionicons name="close" size={18} color="#6C757D" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ACCOUNT INFORMATION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={22} color="#40E0D0" />
              <Text style={styles.sectionTitle}>Account Information</Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoPattern} />
              
              {editMode ? (
                <>
                  <View style={styles.inputField}>
                    <View style={styles.inputLabelRow}>
                      <Ionicons name="mail" size={16} color="#40E0D0" />
                      <Text style={styles.inputLabel}>Email Address</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(text) => handleInputChange("email", text)}
                      placeholder="Enter email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#ADB5BD"
                    />
                  </View>
                  
                  <View style={styles.inputField}>
                    <View style={styles.inputLabelRow}>
                      <Ionicons name="phone-portrait" size={16} color="#40E0D0" />
                      <Text style={styles.inputLabel}>Mobile Number</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={formData.mobile}
                      onChangeText={(text) => handleInputChange("mobile", text)}
                      placeholder="Enter mobile number"
                      keyboardType="phone-pad"
                      placeholderTextColor="#ADB5BD"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="person" size={16} color="#40E0D0" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Username</Text>
                      <Text style={styles.infoValue}>{user?.username || "N/A"}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="mail" size={16} color="#40E0D0" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="phone-portrait" size={16} color="#40E0D0" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Mobile</Text>
                      <Text style={styles.infoValue}>{user?.mobile || "N/A"}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* REFERRAL & STATS */}
          {!editMode && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart" size={22} color="#40E0D0" />
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
                      <Ionicons name="shield-checkmark" size={16} color="#40E0D0" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Account Status</Text>
                      <Text style={styles.statusValue}>Active</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="people" size={16} color="#40E0D0" />
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
                <Ionicons name="settings" size={22} color="#40E0D0" />
                <Text style={styles.sectionTitle}>Settings</Text>
              </View>
              
              <View style={styles.optionsCard}>
                {[
                  { icon: "ticket", title: "My Tickets", color: "#40E0D0" },
                  { icon: "notifications", title: "Notifications", color: "#FF6B35" },
                  { icon: "lock-closed", title: "Privacy & Security", color: "#FFD700" },
                  { icon: "help-circle", title: "Help & Support", color: "#6F42C1" },
                ].map((item, index) => (
                  <TouchableOpacity key={index} style={styles.optionItem}>
                    <View style={[styles.optionIcon, { backgroundColor: `${item.color}15` }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{item.title}</Text>
                      <Text style={styles.optionDescription}>
                        {index === 0 ? "View your game tickets" :
                         index === 1 ? "Manage notifications" :
                         index === 2 ? "Security settings" : "Get help & support"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ADB5BD" />
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
                <Ionicons name="camera" size={24} color="#40E0D0" />
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
                <Ionicons name="images" size={24} color="#40E0D0" />
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
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingPatterns: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  loadingPatternCircle: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  loadingPatternDots: {
    position: 'absolute',
    bottom: '40%',
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#6C757D",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  backgroundPatterns: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  patternCircle1: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 120,
    right: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.05)',
  },
  patternCircle3: {
    position: 'absolute',
    bottom: 150,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.08)',
  },
  patternCircle4: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(64, 224, 208, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(64, 224, 208, 0.04)',
  },
  geometricPattern1: {
    position: 'absolute',
    top: 250,
    right: -20,
    width: 80,
    height: 80,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(255, 107, 53, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.05)',
  },
  geometricPattern2: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.04)',
    transform: [{ rotate: '15deg' }],
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 4,
    fontWeight: "500",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
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
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  profilePatternDots: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
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
    borderColor: "#40E0D0",
  },
  editImageBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#40E0D0",
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
    color: "#40E0D0",
    fontWeight: "600",
    backgroundColor: "rgba(64, 224, 208, 0.1)",
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
    borderBottomColor: "#40E0D0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#40E0D0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#40E0D0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: "#28A745",
    shadowColor: "#28A745",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
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
    color: "#6C757D",
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
    fontWeight: "700",
    color: "#212529",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  infoPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 60,
    height: 60,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(64, 224, 208, 0.02)',
  },
  inputField: {
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#212529",
    backgroundColor: "#F8F9FA",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(64, 224, 208, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6C757D",
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
    borderColor: "#E9ECEF",
    overflow: 'hidden',
    position: 'relative',
  },
  statsPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 20,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
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
    borderColor: "#E9ECEF",
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
    borderColor: "#E9ECEF",
  },
  statLabel: {
    fontSize: 12,
    color: "#6C757D",
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
    borderColor: "#E9ECEF",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
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
    color: "#212529",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: "#6C757D",
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
  },
  modalPattern: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
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
    borderColor: "#E9ECEF",
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 2,
  },
  modalOptionDescription: {
    fontSize: 12,
    color: "#6C757D",
  },
  modalCancelButton: {
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginTop: 8,
  },
  modalCancelText: {
    color: "#6C757D",
    fontWeight: "600",
    fontSize: 15,
  },
});