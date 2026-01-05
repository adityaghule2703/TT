import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const UserGameClaim = ({ navigation, route }) => {
  const { gameId, gameName, ticketId, ticketNumber } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patternRewards, setPatternRewards] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [claimEvidence, setClaimEvidence] = useState("");

  const GAME_IMAGES = {
    trophy: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    pattern: "https://cdn-icons-png.flaticon.com/512/2097/2097069.png",
    diamond: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    celebrate: "https://cdn-icons-png.flaticon.com/512/3126/3126640.png",
  };

  useEffect(() => {
    fetchPatternRewards();
  }, []);

  const fetchPatternRewards = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        "https://exilance.com/tambolatimez/public/api/user/games",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        // Find the specific game by gameId
        const games = response.data.games.data;
        const currentGame = games.find(game => game.id === parseInt(gameId));
        
        if (currentGame && currentGame.pattern_rewards) {
          setPatternRewards(currentGame.pattern_rewards);
        } else {
          Alert.alert("Info", "No claimable patterns available for this game");
        }
      } else {
        Alert.alert("Error", "Failed to load game data");
      }
    } catch (error) {
      console.log("Error fetching pattern rewards:", error);
      // Try to show more detailed error message
      if (error.response) {
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);
      }
      Alert.alert(
        "Error", 
        error.response?.data?.message || 
        error.message || 
        "Failed to load pattern rewards. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedPattern) {
      Alert.alert("Warning", "Please select a pattern to claim");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");
      
      const response = await axios.post(
        "https://exilance.com/tambolatimez/public/api/user/claims/submit",
        {
          game_id: parseInt(gameId),
          ticket_id: parseInt(ticketId),
          reward_name: selectedPattern.reward_name,
          claim_evidence: claimEvidence || `Pattern ${selectedPattern.pattern_id} completed on ticket ${ticketNumber}`,
          game_pattern_id: selectedPattern.pattern_id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success!",
          response.data.message || "Claim submitted successfully. Waiting for host approval.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit claim");
      }
    } catch (error) {
      console.log("Error submitting claim:", error);
      let errorMessage = "Failed to submit claim. Please try again.";
      
      if (error.response) {
        console.log("Error response:", error.response.data);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.errors) {
          // Handle validation errors
          const errors = error.response.data.errors;
          errorMessage = Object.values(errors).flat().join('\n');
        }
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPatternCard = (pattern, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.patternCard,
        selectedPattern?.pattern_id === pattern.pattern_id && styles.selectedPatternCard
      ]}
      onPress={() => setSelectedPattern(pattern)}
      activeOpacity={0.7}
    >
      <View style={styles.patternCardHeader}>
        <View style={styles.patternIconContainer}>
          <Image
            source={{ uri: GAME_IMAGES.trophy }}
            style={styles.patternIcon}
          />
        </View>
        <View style={styles.patternInfo}>
          <Text style={styles.patternName} numberOfLines={1}>
            {pattern.reward_name}
          </Text>
          <Text style={styles.patternDescription} numberOfLines={2}>
            {pattern.description}
          </Text>
        </View>
        {selectedPattern?.pattern_id === pattern.pattern_id && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>

      <View style={styles.patternDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={14} color="#6C757D" />
          <Text style={styles.detailLabel}>Prize:</Text>
          <Text style={styles.detailValue}>₹{pattern.amount}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="ticket-outline" size={14} color="#6C757D" />
          <Text style={styles.detailLabel}>Tickets:</Text>
          <Text style={styles.detailValue}>{pattern.min_tickets_required}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="trophy-outline" size={14} color="#6C757D" />
          <Text style={styles.detailLabel}>Available:</Text>
          <Text style={styles.detailValue}>{pattern.reward_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#40E0D0" />
        <Text style={styles.loadingText}>Loading Claim Form...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#40E0D0" />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.gameName} numberOfLines={1}>
              Submit Claim
            </Text>
            <View style={styles.gameCodeContainer}>
              <Ionicons name="ticket-outline" size={16} color="#6C757D" />
              <Text style={styles.gameCode}>Ticket #{ticketNumber}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Background Patterns */}
        <View style={styles.backgroundPatterns}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Info Card */}
          <View style={styles.card}>
            <View style={styles.cardPattern} />
            
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: GAME_IMAGES.trophy }}
                style={styles.cardHeaderImage}
              />
              <Text style={styles.cardTitle}>Submit Your Claim</Text>
            </View>
            
            <Text style={styles.cardDescription}>
              Select the pattern you have completed on your ticket. Make sure you have marked all required numbers before submitting.
            </Text>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Game:</Text>
                <Text style={styles.infoValue}>{gameName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ticket Number:</Text>
                <Text style={styles.infoValue}>#{ticketNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Available Patterns:</Text>
                <Text style={styles.infoValue}>{patternRewards.length}</Text>
              </View>
            </View>
          </View>

          {/* Available Patterns */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Image
                source={{ uri: GAME_IMAGES.pattern }}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Available Patterns</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{patternRewards.length}</Text>
              </View>
            </View>

            <Text style={styles.sectionSubtitle}>
              Tap on a pattern to select it for your claim
            </Text>

            {patternRewards.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={{ uri: GAME_IMAGES.diamond }}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No Patterns Available</Text>
                <Text style={styles.emptySubtitle}>
                  This game doesn't have any claimable patterns yet
                </Text>
              </View>
            ) : (
              <View style={styles.patternsList}>
                {patternRewards.map((pattern, index) => renderPatternCard(pattern, index))}
              </View>
            )}
          </View>

          {/* Optional Evidence */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color="#40E0D0" />
              <Text style={styles.sectionTitle}>Claim Evidence (Optional)</Text>
            </View>

            <View style={styles.evidenceContainer}>
              <Text style={styles.evidenceLabel}>
                Describe how you completed the pattern (optional):
              </Text>
              <TouchableOpacity
                style={styles.evidenceBox}
                onPress={() => {
                  Alert.prompt(
                    "Claim Evidence",
                    "Describe how you completed the pattern:",
                    (text) => setClaimEvidence(text),
                    "plain-text",
                    claimEvidence,
                    "default"
                  );
                }}
              >
                <Text style={[
                  styles.evidenceText,
                  !claimEvidence && styles.evidencePlaceholder
                ]}>
                  {claimEvidence || "Tap to add evidence text..."}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.noteContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#6C757D" />
              <Text style={styles.noteText}>
                Note: Your ticket will be verified by the game host before the claim is approved.
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedPattern || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitClaim}
            disabled={!selectedPattern || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>
                  Submit Claim for Approval
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Bottom Space */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(64, 224, 208, 0.05)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.03)',
  },
  // Header Styles
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    zIndex: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  headerTextContainer: {
    flex: 1,
  },
  gameName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF6B35",
    letterSpacing: -0.5,
  },
  gameCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  gameCode: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  content: {
    padding: 20,
    zIndex: 1,
    marginTop: 0,
  },
  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    position: 'relative',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 25,
    backgroundColor: 'rgba(64, 224, 208, 0.03)',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardHeaderImage: {
    width: 24,
    height: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  // Section Styles
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  sectionIcon: {
    width: 20,
    height: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6C757D",
    marginBottom: 16,
    fontStyle: 'italic',
  },
  countBadge: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  // Pattern Cards
  patternsList: {
    gap: 12,
  },
  patternCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  selectedPatternCard: {
    borderColor: "#4CAF50",
    borderWidth: 2,
    backgroundColor: '#F1F8E9',
  },
  patternCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  patternIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF7E6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  patternIcon: {
    width: 20,
    height: 20,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  patternDescription: {
    fontSize: 12,
    color: "#6C757D",
    lineHeight: 16,
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
  patternDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: "#6C757D",
    marginRight: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#212529",
  },
  // Evidence Section
  evidenceContainer: {
    marginTop: 8,
  },
  evidenceLabel: {
    fontSize: 13,
    color: "#6C757D",
    marginBottom: 8,
  },
  evidenceBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    justifyContent: 'center',
  },
  evidenceText: {
    fontSize: 14,
    color: "#212529",
    lineHeight: 20,
  },
  evidencePlaceholder: {
    color: "#9E9E9E",
    fontStyle: "italic",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  noteText: {
    fontSize: 12,
    color: "#FF6B35",
    flex: 1,
    lineHeight: 16,
  },
  // Submit Button
  submitButton: {
    backgroundColor: "#FF6B35",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#CCCCCC",
    borderColor: "#CCCCCC",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6C757D",
    fontWeight: "500",
  },
  bottomSpace: {
    height: 20,
  },
});

export default UserGameClaim;