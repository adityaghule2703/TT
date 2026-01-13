import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const HostGameOptions = ({ route, navigation }) => {
  const { gameId, gameName, gameStatus = "scheduled" } = route.params;
  const [startingGame, setStartingGame] = useState(false);

  const handleStartGame = async () => {
    Alert.alert(
      "Start Game",
      `Are you sure you want to start "${gameName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Start Game",
          onPress: async () => {
            try {
              setStartingGame(true);
              const token = await AsyncStorage.getItem("hostToken");

              const response = await axios.post(
                `https://exilance.com/tambolatimez/public/api/host/games/${gameId}/start`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );

              if (response.data.success) {
                Alert.alert(
                  "Success",
                  "Game started successfully!",
                  [
                    {
                      text: "Enter Game Room",
                      onPress: () => {
                        navigation.navigate("HostGameRoom", {
                          gameId: gameId,
                          gameName: gameName,
                        });
                      }
                    },
                    {
                      text: "Stay Here",
                      style: "cancel",
                      onPress: () => {
                        // Simply go back to games list
                        navigation.goBack();
                      }
                    }
                  ]
                );
              } else {
                throw new Error("Failed to start game");
              }
            } catch (error) {
              console.log("Error starting game:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || error.message || "Failed to start game"
              );
            } finally {
              setStartingGame(false);
            }
          }
        }
      ]
    );
  };

  const renderOptionButton = (icon, title, onPress, color = "#FF7675", key, isLoading = false) => (
    <View key={key} style={styles.buttonWrapper}>
      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: color }]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name={icon} size={28} color="#FFF" />
            <Text style={styles.optionButtonText}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // Determine which buttons to show based on game status
  const getButtonsToShow = () => {
    const buttons = [];
    let buttonIndex = 0;
    
    // Start Game or Enter Game Room based on status
    if (gameStatus === "scheduled" || gameStatus === "active") {
      buttons.push(
        renderOptionButton(
          "play-circle",
          "Start Game",
          handleStartGame,
          "#4CAF50",
          `start-${buttonIndex++}`,
          startingGame
        )
      );
    } else if (gameStatus === "live") {
      buttons.push(
        renderOptionButton(
          "game-controller",
          "Enter Game Room",
          () => navigation.navigate("HostGameRoom", {
            gameId: gameId,
            gameName: gameName,
          }),
          "#FF7675",
          `enter-${buttonIndex++}`
        )
      );
    }
    
    // Always show these buttons
    buttons.push(
      renderOptionButton(
        "ticket-outline",
        "Ticket Requests",
        () => navigation.navigate("HostTicketRequests", {
          gameId: gameId,
          gameName: gameName,
        }),
        "#9C27B0",
        `tickets-${buttonIndex++}`
      ),
      renderOptionButton(
        "people-outline",
        "Players List",
        () => navigation.navigate("HostGameUsers", {
          gameId: gameId,
          gameName: gameName,
        }),
        "#FF9800",
        `players-${buttonIndex++}`
      )
    );
    
    
    if (gameStatus !== "live") {
      buttons.push(
        renderOptionButton(
          "create-outline",
          "Edit Game",
          () => navigation.navigate("HostGameEdit", {
            gameId: gameId,
            gameName: gameName,
          }),
          "#607D8B",
          `edit-${buttonIndex++}`
        )
      );
    }
    
    return buttons;
  };

  const getStatusText = () => {
    switch (gameStatus) {
      case "scheduled":
        return "Scheduled";
      case "active":
        return "Active";
      case "live":
        return "Live";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Scheduled";
    }
  };

  const getStatusColor = () => {
    switch (gameStatus) {
      case "scheduled":
        return "#FF9800";
      case "active":
        return "#4CAF50";
      case "live":
        return "#FF7675";
      case "completed":
        return "#9C27B0";
      case "cancelled":
        return "#F44336";
      default:
        return "#607D8B";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FF7675" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {gameName}
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.headerSubtitle}>Game Options</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + "20" }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Options Grid */}
        <View style={styles.optionsGrid}>
          {getButtonsToShow()}
        </View>

        {/* Show message if no Edit button (game is live) */}
        {/* {gameStatus === "live" && (
          <View style={styles.messageBox}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.messageText}>
              Game is live! Edit option is disabled during live gameplay.
            </Text>
          </View>
        )} */}

        {/* Secondary Options */}
        <View style={styles.secondaryOptions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              Alert.alert(
                "Share Game",
                "Share game link with players",
                [{ text: "OK" }]
              );
            }}
          >
            <Ionicons name="share-social-outline" size={20} color="#666" />
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("HostGamePatterns")}
          >
            <Ionicons name="grid-outline" size={20} color="#666" />
            <Text style={styles.secondaryButtonText}>Patterns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              Alert.alert(
                "Help",
                "Game management help",
                [{ text: "OK" }]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color="#666" />
            <Text style={styles.secondaryButtonText}>Help</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
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
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: "#FF7675",
    paddingTop: 20,
    paddingBottom: 24,
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
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  buttonWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },
  optionButton: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  optionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFECB3",
    gap: 10,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: "#FF9800",
    fontWeight: "500",
  },
  secondaryOptions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  bottomSpace: {
    height: 40,
  },
});

export default HostGameOptions;