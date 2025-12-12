import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";

const GameDetails = ({ route }) => {
  const { game } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{game.game_name}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Game Code:</Text>
        <Text style={styles.value}>{game.game_code}</Text>

        <Text style={styles.label}>Date & Time:</Text>
        <Text style={styles.value}>{game.game_date} {game.game_start_time}</Text>

        <Text style={styles.label}>Ticket Cost:</Text>
        <Text style={styles.value}>₹{game.ticket_cost}</Text>

        <Text style={styles.label}>Max Players:</Text>
        <Text style={styles.value}>{game.max_players}</Text>

        <Text style={styles.label}>Available Tickets:</Text>
        <Text style={styles.value}>{game.available_tickets_count}</Text>

        <Text style={styles.label}>Message:</Text>
        <Text style={styles.value}>{game.message}</Text>

        <Text style={styles.label}>Rewards:</Text>
        {game.pattern_rewards && game.pattern_rewards.length > 0 ? (
          game.pattern_rewards.map((reward) => (
            <View key={reward.pattern_id} style={styles.reward}>
              <Text style={styles.rewardName}>{reward.reward_name}</Text>
              <Text style={styles.rewardDesc}>
                {reward.description} | Amount: ₹{reward.amount} | Count: {reward.reward_count}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.value}>No rewards listed</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default GameDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8FA", padding: 18 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 15 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  label: { fontSize: 14, color: "#777", fontWeight: "700", marginTop: 10 },
  value: { fontSize: 15, color: "#333", marginTop: 3 },
  reward: { marginTop: 8, padding: 8, backgroundColor: "#FAFAFA", borderRadius: 10 },
  rewardName: { fontWeight: "800", fontSize: 15 },
  rewardDesc: { fontSize: 13, color: "#555", marginTop: 2 },
});
