import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const HostProfile = ({ navigation, onLogout }) => {
  const [hostData, setHostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [kycModalVisible, setKycModalVisible] = useState(false);

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

  const fetchHostProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("hostToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/host/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.data.host) {
        const host = response.data.host;
        setHostData(host);
        
        // Initialize form data
        setFormData({
          name: host.name || "",
          email: host.email || "",
          mobile: host.mobile || "",
          address: host.address || "",
        });
        
        // Set profile image URL
        if (host.profile_image_url) {
          setImageUri(host.profile_image_url);
        } else if (host.profile_image) {
          setImageUri(getFullImageUrl(host.profile_image));
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.log("Error fetching host profile:", error);
      setError(error.response?.data?.message || error.message || "Failed to load profile");
      
      // If token is invalid, logout
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please login again");
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostProfile();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== "granted" || libraryStatus !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant camera and photo library permissions to upload profile images!"
      );
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
      const token = await AsyncStorage.getItem("hostToken");
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobile", formData.mobile);
      formDataToSend.append("address", formData.address);

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
        "https://exilance.com/tambolatimez/public/api/host/profile",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data && response.data.host) {
        const updatedHost = response.data.host;
        setHostData(updatedHost);
        Alert.alert("Success", "Profile updated successfully!");
        setEditMode(false);
        
        // Update image URL from API response
        if (updatedHost.profile_image_url) {
          setImageUri(updatedHost.profile_image_url);
        } else if (updatedHost.profile_image) {
          setImageUri(getFullImageUrl(updatedHost.profile_image));
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


  const uploadKYCDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });

      if (result.assets && result.assets[0].uri) {
        setUploading(true);
        const token = await AsyncStorage.getItem("hostToken");
        
        if (!token) {
          throw new Error("No authentication token found");
        }

        const formData = new FormData();
        formData.append('kyc_document', {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType,
          name: 'kyc_document' + (result.assets[0].mimeType === 'application/pdf' ? '.pdf' : '.jpg'),
        });

        const response = await axios.post(
          "https://exilance.com/tambolatimez/public/api/host/upload-kyc",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
              Accept: "application/json",
            },
          }
        );

        if (response.data.success) {
          Alert.alert("Success", "KYC document uploaded successfully");
          fetchHostProfile(); // Refresh profile data
        } else {
          throw new Error(response.data.message || "Failed to upload KYC document");
        }
      }
    } catch (error) {
      console.log("Error uploading KYC document:", error);
      Alert.alert("Error", error.response?.data?.message || error.message || "Failed to upload KYC document");
    } finally {
      setUploading(false);
    }
  };

  const viewKYCDocument = async () => {
    if (!hostData?.kyc_document_url) {
      Alert.alert("Info", "No KYC document available");
      return;
    }

    // Check if it's an image (jpg, jpeg, png) or PDF
    const url = hostData.kyc_document_url;
    const isImage = /\.(jpg|jpeg|png)$/i.test(url);
    const isPDF = /\.pdf$/i.test(url);

    if (isImage) {
      // For images, show in modal
      setKycModalVisible(true);
    } else if (isPDF) {
      // For PDFs, try to open in browser
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Error", "Cannot open PDF document. Please install a PDF viewer app.");
        }
      } catch (error) {
        console.log("Error opening PDF:", error);
        Alert.alert("Error", "Failed to open PDF document");
      }
    } else {
      Alert.alert("Info", "Document format not supported for preview");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "token",
                "hostToken",
                "host",
                "userData",
                "userRole"
              ]);
              onLogout();
            } catch (error) {
              console.log("Logout error:", error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getKYCStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "#2ecc71";
      case "pending":
        return "#f39c12";
      case "rejected":
        return "#e74c3c";
      default:
        return "#95a5a6";
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
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 10, color: "#7f8c8d" }}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 30 }}>
        <FontAwesome name="exclamation-triangle" size={60} color="#e74c3c" />
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#2c3e50", marginTop: 20, marginBottom: 10 }}>
          Oops! Something went wrong
        </Text>
        <Text style={{ fontSize: 14, color: "#7f8c8d", textAlign: "center", marginBottom: 30 }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: "#3498db", paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }}
          onPress={fetchHostProfile}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hostData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 30 }}>
        <FontAwesome name="user-slash" size={60} color="#95a5a6" />
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#2c3e50", marginTop: 20, marginBottom: 10 }}>
          No profile data found
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: "#3498db", paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }}
          onPress={fetchHostProfile}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Load Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
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
                editMode && { borderWidth: 2, borderColor: "#3498db" },
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
            <Text style={styles.userName}>{hostData?.name || "Host"}</Text>
          )}

          <View style={styles.usernameContainer}>
            <Text style={styles.username}>@{hostData?.username}</Text>
            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>ID: </Text>
              <Text style={styles.idValue}>{hostData?.id}</Text>
            </View>
          </View>

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
                  name: hostData?.name || "",
                  email: hostData?.email || "",
                  mobile: hostData?.mobile || "",
                  address: hostData?.address || "",
                });
                // Reset image to original from server
                if (hostData?.profile_image_url) {
                  setImageUri(hostData.profile_image_url);
                } else if (hostData?.profile_image) {
                  setImageUri(getFullImageUrl(hostData.profile_image));
                } else {
                  setImageUri(null);
                }
              }}
            >
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <FontAwesome name="star" size={20} color="#f1c40f" />
            <Text style={styles.statValue}>{hostData?.ratings || 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <FontAwesome name="users" size={20} color="#3498db" />
            <Text style={styles.statValue}>{hostData?.referral_points || 0}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <FontAwesome name="crown" size={20} color="#9b59b6" />
            <Text style={styles.statValue}>{hostData?.subscription?.days_remaining || hostData?.subscription_days_remaining || 0}</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Personal Details</Text>
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
                  editable={false}
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
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Address:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => handleInputChange("address", text)}
                  placeholder="Address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <FontAwesome name="envelope" size={16} color="#3498db" style={styles.detailIcon} />
                <Text style={styles.infoText}>Email: {hostData?.email || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome name="phone" size={16} color="#3498db" style={styles.detailIcon} />
                <Text style={styles.infoText}>Mobile: {hostData?.mobile || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome name="map-marker" size={16} color="#3498db" style={styles.detailIcon} />
                <Text style={styles.infoText}>Address: {hostData?.address || "Not set"}</Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome name="birthday-cake" size={16} color="#3498db" style={styles.detailIcon} />
                <Text style={styles.infoText}>Date of Birth: {formatDate(hostData?.dob)}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.detailRow}>
            <FontAwesome name="gift" size={16} color="#9b59b6" style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.infoText}>Referral Code</Text>
              <Text style={styles.referralCode}>{hostData?.referral_code}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <FontAwesome name="shield" size={16} color="#e74c3c" style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.infoText}>KYC Status</Text>
              <View style={styles.kycStatusContainer}>
                <View
                  style={[
                    styles.kycStatusDot,
                    { backgroundColor: getKYCStatusColor(hostData?.kyc_status) },
                  ]}
                />
                <Text
                  style={[
                    styles.kycStatusText,
                    { color: getKYCStatusColor(hostData?.kyc_status) },
                  ]}
                >
                  {hostData?.kyc_status?.toUpperCase() || "N/A"}
                </Text>
              </View>
            </View>
            {(hostData?.kyc_status === "pending" || hostData?.kyc_status === "rejected") && (
              <TouchableOpacity 
                style={styles.kycButton}
                onPress={uploadKYCDocument}
                disabled={uploading}
              >
                <Text style={styles.kycButtonText}>
                  {uploading ? "Uploading..." : "Upload KYC"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {hostData?.kyc_document_url && (
            <View style={styles.detailRow}>
              <FontAwesome name="file" size={16} color="#3498db" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.infoText}>KYC Document</Text>
                <TouchableOpacity onPress={viewKYCDocument}>
                  <Text style={styles.kycDocumentText}>View Document</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <FontAwesome name="calendar" size={16} color="#2ecc71" style={styles.detailIcon} />
            <Text style={styles.infoText}>Account Created: {formatDate(hostData?.created_at)}</Text>
          </View>

          <View style={styles.detailRow}>
            <FontAwesome name="circle" size={16} color="#2ecc71" style={styles.detailIcon} />
            <Text style={styles.infoText}>Status: {hostData?.status || "N/A"}</Text>
          </View>
        </View>

        {/* Subscription Info */}
        {hostData?.subscription_status === "active" && (
          <>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={[styles.infoCard, { backgroundColor: "#fff8e1", borderColor: "#ffecb3" }]}>
              <View style={styles.detailRow}>
                <FontAwesome name="crown" size={18} color="#f1c40f" style={styles.detailIcon} />
                <Text style={[styles.infoText, { color: "#f57c00", fontWeight: "700" }]}>
                  Active Subscription
                </Text>
              </View>
              <Text style={styles.subscriptionDetails}>
                Plan ID: {hostData.subscription_plan_id} | 
                Days Remaining: {hostData.subscription_days_remaining || 
                  Math.ceil((new Date(hostData.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24))}
              </Text>
              <Text style={styles.subscriptionDates}>
                Valid from {formatDate(hostData.subscription_start_date)} to {formatDate(hostData.subscription_end_date)}
              </Text>
            </View>
          </>
        )}

        {!editMode && (
          <>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity style={styles.optionCard}>
              <FontAwesome name="lock" size={16} color="#3498db" style={styles.optionIcon} />
              <Text style={styles.optionText}>Change Password</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Profile Image Selection Modal */}
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
              <FontAwesome name="camera" size={20} color="#fff" style={styles.modalOptionIcon} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImagePick("gallery")}
            >
              <FontAwesome name="photo" size={20} color="#fff" style={styles.modalOptionIcon} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: "#ccc" }]}
              onPress={() => setImageModalVisible(false)}
            >
              <FontAwesome name="close" size={20} color="#333" style={styles.modalOptionIcon} />
              <Text style={[styles.modalOptionText, { color: "#333" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* KYC Document View Modal */}
      <Modal
        visible={kycModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setKycModalVisible(false)}
      >
        <View style={styles.kycModalContainer}>
          <View style={styles.kycModalContent}>
            <View style={styles.kycModalHeader}>
              <Text style={styles.kycModalTitle}>KYC Document</Text>
              <TouchableOpacity onPress={() => setKycModalVisible(false)}>
                <FontAwesome name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            
            {hostData?.kyc_document_url && (
              <View style={styles.kycImageContainer}>
                <Image
                  source={{ uri: hostData.kyc_document_url }}
                  style={styles.kycImage}
                  resizeMode="contain"
                  onError={() => {
                    Alert.alert("Error", "Failed to load image. The document might be a PDF or corrupted.");
                    setKycModalVisible(false);
                  }}
                />
              </View>
            )}
            
            <View style={styles.kycModalFooter}>
              <TouchableOpacity
                style={styles.kycModalButton}
                onPress={() => setKycModalVisible(false)}
              >
                <Text style={styles.kycModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8FA", padding: 18 },
  header: { alignItems: "center", marginTop: 20 },
  profilePic: { width: 90, height: 90, borderRadius: 45 },
  editImageBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3498db",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  editImageText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  userName: { fontSize: 20, fontWeight: "800", marginTop: 10, marginBottom: 5, color: "#2c3e50" },
  userNameInput: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#3498db",
    width: "60%",
    textAlign: "center",
    paddingVertical: 5,
    color: "#2c3e50",
  },
  usernameContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  username: { fontSize: 13, color: "#7f8c8d", marginBottom: 2 },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  idLabel: { fontSize: 12, color: "#7f8c8d" },
  idValue: { fontSize: 13, fontWeight: "700", color: "#2c3e50" },
  editButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  editButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  statsCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2c3e50",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: "#7f8c8d",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#ecf0f1",
  },
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
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  detailIcon: {
    marginRight: 10,
    width: 24,
    textAlign: "center",
  },
  detailContent: {
    flex: 1,
  },
  infoText: { fontSize: 14, color: "#777" },
  referralCode: {
    fontSize: 16,
    fontWeight: "800",
    color: "#9b59b6",
    letterSpacing: 1,
    marginTop: 2,
  },
  kycStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  kycStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  kycStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  kycButton: {
    backgroundColor: "#f39c12",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  kycButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  kycDocumentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
    textDecorationLine: "underline",
    marginTop: 2,
  },
  inputContainer: { marginVertical: 8 },
  inputLabel: { fontSize: 14, color: "#555", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  subscriptionDetails: {
    fontSize: 13,
    color: "#5d4037",
    marginTop: 4,
    marginLeft: 34,
  },
  subscriptionDates: {
    fontSize: 12,
    color: "#8d6e63",
    marginTop: 2,
    marginLeft: 34,
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
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    marginRight: 10,
  },
  optionText: { fontSize: 15, fontWeight: "700", color: "#3498db" },
  logoutBtn: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 30,
    marginBottom: 50,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  
  // Profile Image Modal
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
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginVertical: 5,
    flexDirection: "row",
    justifyContent: "center",
  },
  modalOptionIcon: {
    marginRight: 10,
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // KYC Document Modal
  kycModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  kycModalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "95%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  kycModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  kycModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
  },
  kycImageContainer: {
    width: "100%",
    height: 400,
    padding: 10,
  },
  kycImage: {
    width: "100%",
    height: "100%",
  },
  kycModalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  kycModalButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  kycModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  footerSpace: {
    height: 30,
  },
});

export default HostProfile;