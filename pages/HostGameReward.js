import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const HostGameReward = ({ route, navigation }) => {
  const { gameId, gameName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patterns, setPatterns] = useState([]);
  const [rewards, setRewards] = useState([]);
  
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });

  useEffect(() => {
    fetchGamePatterns();
  }, []);

  const fetchGamePatterns = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("hostToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      // First, get game details to fetch selected patterns
      const gameResponse = await axios.get(
        `https://exilance.com/tambolatimez/public/api/host/games/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (gameResponse.data.success) {
        const gameData = gameResponse.data.game;
        const selectedPatternIds = gameData.selected_patterns || [];
        
        if (selectedPatternIds.length === 0) {
          showToast("No patterns selected for this game", "error");
          setPatterns([]);
          return;
        }

        // Fetch pattern details
        const patternsResponse = await axios.get(
          "https://exilance.com/tambolatimez/public/api/host/patterns/available",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (patternsResponse.data.status) {
          const allPatterns = patternsResponse.data.data || [];
          
          // Filter patterns that are selected in the game
          const selectedPatterns = allPatterns.filter(pattern => 
            selectedPatternIds.includes(pattern.id)
          );
          
          setPatterns(selectedPatterns);
          
          // Initialize rewards array with empty values
          const initialRewards = selectedPatterns.map(pattern => ({
            pattern_id: pattern.id,
            pattern_name: pattern.pattern_name,
            pattern_description: pattern.description,
            reward_name: "",
            description: "",
            amount: "",
            reward_count: "",
            min_tickets_required: "",
          }));
          
          setRewards(initialRewards);
        } else {
          throw new Error("Failed to fetch patterns");
        }
      } else {
        throw new Error("Failed to fetch game details");
      }
    } catch (error) {
      console.log("Error fetching patterns:", error);
      showToast(
        error.response?.data?.message || error.message || "Failed to load patterns",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRewardChange = (index, field, value) => {
    const updatedRewards = [...rewards];
    
    // Validate numeric fields
    if (field === "amount" || field === "reward_count" || field === "min_tickets_required") {
      // Allow only numbers and decimal for amount
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        updatedRewards[index][field] = value;
      }
    } else {
      updatedRewards[index][field] = value;
    }
    
    setRewards(updatedRewards);
  };

  const validateRewards = () => {
    for (const reward of rewards) {
      if (!reward.reward_name?.trim()) {
        showToast("Please enter reward name for all patterns", "error");
        return false;
      }
      
      if (!reward.amount || parseFloat(reward.amount) <= 0) {
        showToast("Please enter valid amount for all patterns", "error");
        return false;
      }
      
      if (!reward.reward_count || parseInt(reward.reward_count) <= 0) {
        showToast("Please enter valid reward count for all patterns", "error");
        return false;
      }
      
      if (!reward.min_tickets_required || parseInt(reward.min_tickets_required) <= 0) {
        showToast("Please enter valid minimum tickets required for all patterns", "error");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateRewards()) return;

    Alert.alert(
      "Confirm Rewards",
      "Are you sure you want to save these rewards? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Save Rewards",
          onPress: async () => {
            try {
              setSubmitting(true);
              const token = await AsyncStorage.getItem("hostToken");

              if (!token) {
                throw new Error("No authentication token found");
              }

              // Prepare request body
              const pattern_rewards = rewards.map(reward => ({
                pattern_id: reward.pattern_id,
                reward_name: reward.reward_name.trim(),
                description: reward.description?.trim() || "",
                amount: parseFloat(reward.amount),
                reward_count: parseInt(reward.reward_count),
                min_tickets_required: parseInt(reward.min_tickets_required),
              }));

              const requestBody = { pattern_rewards };

              const response = await axios.put(
                `https://exilance.com/tambolatimez/public/api/host/patterns/game/${gameId}/update-rewards`,
                requestBody,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.data.success || response.data.status) {
                showToast(
                  response.data.message || "Rewards added successfully!",
                  "success"
                );
                
                // Navigate back after success
                setTimeout(() => {
                  navigation.goBack();
                }, 1500);
              } else {
                throw new Error(response.data.message || "Failed to save rewards");
              }
            } catch (error) {
              console.log("Error saving rewards:", error);
              showToast(
                error.response?.data?.message || error.message || "Failed to save rewards",
                "error"
              );
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const Toast = () => {
    if (!toast.visible) return null;
    
    const backgroundColor = toast.type === "success" ? "#4CAF50" : "#FF6B6B";
    
    useEffect(() => {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <View style={[styles.toast, { backgroundColor }]}>
        <Ionicons 
          name={toast.type === "success" ? "checkmark-circle" : "alert-circle"} 
          size={20} 
          color="#FFF" 
        />
        <Text style={styles.toastText}>{toast.message}</Text>
      </View>
    );
  };

  const renderPatternReward = (reward, index) => {
    const pattern = patterns.find(p => p.id === reward.pattern_id);
    
    return (
      <View key={reward.pattern_id} style={styles.rewardCard}>
        <View style={styles.patternHeader}>
          <View style={styles.patternIconContainer}>
            <Ionicons name="grid-outline" size={18} color="#7E57C2" />
          </View>
          <View style={styles.patternInfo}>
            <Text style={styles.patternName}>
              {pattern?.pattern_name?.replace(/_/g, " ") || "Pattern"}
            </Text>
            <Text style={styles.patternDescription} numberOfLines={2}>
              {pattern?.description || "No description available"}
            </Text>
          </View>
          <View style={styles.patternNumber}>
            <Text style={styles.patternNumberText}>{index + 1}</Text>
          </View>
        </View>

        <View style={styles.rewardForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reward Name *</Text>
            <TextInput
              style={styles.input}
              value={reward.reward_name}
              onChangeText={(text) => handleRewardChange(index, "reward_name", text)}
              placeholder="e.g., First Line Prize"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reward.description}
              onChangeText={(text) => handleRewardChange(index, "description", text)}
              placeholder="Describe this reward..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="logo-rupee" size={16} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.currencyInput]}
                  value={reward.amount}
                  onChangeText={(text) => handleRewardChange(index, "amount", text)}
                  keyboardType="decimal-pad"
                  placeholder="500.00"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Reward Count *</Text>
              <TextInput
                style={styles.input}
                value={reward.reward_count}
                onChangeText={(text) => handleRewardChange(index, "reward_count", text)}
                keyboardType="number-pad"
                placeholder="2"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Min Tickets Required *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="ticket-outline" size={16} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.ticketInput]}
                value={reward.min_tickets_required}
                onChangeText={(text) => handleRewardChange(index, "min_tickets_required", text)}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7E57C2" />
        <Text style={styles.loadingText}>Loading patterns...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#7E57C2" barStyle="light-content" />
      
      {/* Toast Notification */}
      <Toast />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Add Rewards
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {gameName}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#7E57C2" />
              <Text style={styles.infoTitle}>Set Rewards for Patterns</Text>
            </View>
            <Text style={styles.infoText}>
              Add reward details for each pattern selected in your game. 
              Players can win these rewards when they complete the patterns.
            </Text>
            {patterns.length > 0 && (
              <View style={styles.patternsCount}>
                <Ionicons name="grid-outline" size={14} color="#7E57C2" />
                <Text style={styles.patternsCountText}>
                  {patterns.length} pattern{patterns.length > 1 ? "s" : ""} to configure
                </Text>
              </View>
            )}
          </View>

          {patterns.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Ionicons name="gift-outline" size={80} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyStateTitle}>No Patterns Found</Text>
              <Text style={styles.emptyStateText}>
                This game doesn't have any patterns selected. 
                Please add patterns to the game first.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#FFF" />
                <Text style={styles.emptyStateButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Rewards List */}
              <View style={styles.rewardsList}>
                {rewards.map((reward, index) => renderPatternReward(reward, index))}
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Rewards Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Patterns:</Text>
                  <Text style={styles.summaryValue}>{patterns.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Rewards:</Text>
                  <Text style={styles.summaryValue}>
                    {rewards.reduce((sum, reward) => sum + (parseInt(reward.reward_count) || 0), 0)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Prize Pool:</Text>
                  <Text style={styles.summaryValue}>
                    ₹{rewards.reduce((sum, reward) => {
                      const amount = parseFloat(reward.amount) || 0;
                      const count = parseInt(reward.reward_count) || 0;
                      return sum + (amount * count);
                    }, 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Action Buttons */}
          {patterns.length > 0 && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#FFF" />
                    <Text style={styles.submitButtonText}>Save All Rewards</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#7E57C2",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#F3F0FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5DEFF",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7E57C2",
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 16,
  },
  patternsCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 6,
  },
  patternsCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7E57C2",
  },
  rewardCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patternHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  patternIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  patternDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  patternNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7E57C2",
    justifyContent: "center",
    alignItems: "center",
  },
  patternNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  rewardForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    paddingLeft: 0,
  },
  ticketInput: {
    flex: 1,
    paddingLeft: 0,
  },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7E57C2",
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: "#7E57C2",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#7E57C2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIllustration: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 300,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7E57C2",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#7E57C2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  bottomSpace: {
    height: 20,
  },
  toast: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 999,
  },
  toastText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
});

export default HostGameReward;