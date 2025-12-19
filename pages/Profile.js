import React, { useEffect, useState } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";

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

  const BASE_URL = "https://exilance.com/tambolatimez/public/";

  // Helper function to get full image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return BASE_URL + cleanPath;
  };

  useEffect(() => {
    fetchProfile();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant camera roll permissions to upload profile images!"
      );
    }
  };

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
        
        // Use profile_image_url from API response if available
        if (res.data.user.profile_image_url) {
          setImageUri(res.data.user.profile_image_url);
        } else if (res.data.user.profile_image) {
          // Fallback to constructing URL from profile_image path
          setImageUri(getFullImageUrl(res.data.user.profile_image));
        }
      }
    } catch (error) {
      console.log("Fetch profile error:", error);
      Alert.alert("Error", "Failed to fetch profile");
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
      Alert.alert("Error", "Name is required");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobile", formData.mobile);

      // Append image if selected and it's a new local image
      if (imageUri && 
          !imageUri.startsWith(BASE_URL) && 
          !imageUri.startsWith('http') &&
          (imageUri.startsWith('file://') || imageUri.startsWith('content://'))) {
        const localUri = imageUri;
        const filename = localUri.split('/').pop();
        
        // Extract file extension
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
        
        // Update image URL from API response
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
    try {
      const token = await AsyncStorage.getItem("token");

      await axios.post(
        `${BASE_URL}api/user/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      Alert.alert("Logged Out", "You have been logged out successfully.");
      onLogout();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong. Try again.");
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF7675" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => editMode && setImageModalVisible(true)}
            disabled={!editMode}
          >
            <Image
              source={{
                uri: imageUri
                  ? imageUri
                  : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
              }}
              style={[
                styles.profilePic,
                editMode && { borderWidth: 2, borderColor: "#FF7675" },
              ]}
              onError={() => setImageUri(null)}
            />
            {editMode && (
              <View style={styles.editImageBadge}>
                <Text style={styles.editImageText}>Edit</Text>
              </View>
            )}
          </TouchableOpacity>

          {editMode ? (
            <TextInput
              style={styles.userNameInput}
              value={formData.name}
              onChangeText={(text) => handleInputChange("name", text)}
              placeholder="Enter your name"
            />
          ) : (
            <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (editMode) {
                updateProfile();
              } else {
                setEditMode(true);
              }
            }}
            disabled={saving}
          >
            <Text style={styles.editButtonText}>
              {saving ? "Saving..." : editMode ? "Save" : "Edit Profile"}
            </Text>
          </TouchableOpacity>

          {editMode && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: "#ccc", marginTop: 5 }]}
              onPress={() => {
                setEditMode(false);
                // Reset form data to original
                setFormData({
                  name: user?.name || "",
                  email: user?.email || "",
                  mobile: user?.mobile || "",
                });
                // Reset image to original from server
                if (user?.profile_image_url) {
                  setImageUri(user.profile_image_url);
                } else if (user?.profile_image) {
                  setImageUri(getFullImageUrl(user.profile_image));
                } else {
                  setImageUri(null);
                }
              }}
            >
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.infoCard}>
          {editMode ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email:</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange("email", text)}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile:</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mobile}
                  onChangeText={(text) => handleInputChange("mobile", text)}
                  placeholder="Mobile number"
                  keyboardType="phone-pad"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.infoText}>Username: {user?.username || "N/A"}</Text>
              <Text style={styles.infoText}>Email: {user?.email || "N/A"}</Text>
              <Text style={styles.infoText}>Mobile: {user?.mobile || "N/A"}</Text>
            </>
          )}
          <Text style={styles.infoText}>
            Referral Code: {user?.referral_code || "N/A"}
          </Text>
          <Text style={styles.infoText}>
            Referral Points: {user?.referral_points || "0"}
          </Text>
          <Text style={styles.infoText}>Status: {user?.status || "N/A"}</Text>
          <Text style={styles.infoText}>
            Under Referral: {user?.under_referral || "N/A"}
          </Text>
        </View>

        {!editMode && (
          <>
            <Text style={styles.sectionTitle}>Settings</Text>
            {["My Tickets", "Notifications", "Privacy & Security", "Help & Support"].map(
              (item, i) => (
                <TouchableOpacity key={i} style={styles.optionCard}>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )
            )}
          </>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Image Selection Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Profile Picture</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImagePick("camera")}
            >
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImagePick("gallery")}
            >
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: "#ccc" }]}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={[styles.modalOptionText, { color: "#333" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8FA", padding: 18 },
  header: { alignItems: "center", marginTop: 20 },
  profilePic: { width: 90, height: 90, borderRadius: 45 },
  editImageBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF7675",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  editImageText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  userName: { fontSize: 20, fontWeight: "800", marginTop: 10, marginBottom: 10 },
  userNameInput: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FF7675",
    width: "60%",
    textAlign: "center",
    paddingVertical: 5,
  },
  editButton: {
    backgroundColor: "#FF7675",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  editButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  sectionTitle: { marginTop: 25, fontSize: 18, fontWeight: "800", color: "#333" },
  infoCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: { fontSize: 14, marginVertical: 4, color: "#777" },
  inputContainer: { marginVertical: 8 },
  inputLabel: { fontSize: 14, color: "#555", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  optionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: { fontSize: 15, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: "#FF7675",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 30,
    marginBottom: 50,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  modalOption: {
    backgroundColor: "#FF7675",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginVertical: 5,
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});