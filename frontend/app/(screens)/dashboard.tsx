import React, { JSX, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Title,
  FAB,
  useTheme,
  ActivityIndicator,
  Avatar,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useMood } from "../../context/MoodContext";

const { width } = Dimensions.get("window");

interface FeatureCard {
  title: string;
  icon: string;
  screen: string;
  color: string;
  description: string;
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { todayMood, fetchTodayMood, loading: moodLoading } = useMood();
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchTodayMood();
  }, []);

  const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || "http://192.168.18.164:3000";

  const features: FeatureCard[] = [
    {
      title: "Mood Tracker",
      icon: "😊",
      screen: "mood-tracker",
      color: "#4CAF50",
      description: "Log your daily mood",
    },
    {
      title: "AI Therapist",
      icon: "🤖",
      screen: "chat",
      color: "#2196F3",
      description: "Chat with our AI companion",
    },
    {
      title: "Breathing Exercises",
      icon: "🌬️",
      screen: "breathing",
      color: "#9C27B0",
      description: "Relax with guided breathing",
    },
    {
      title: "Habit Tracker",
      icon: "✅",
      screen: "habits",
      color: "#FF9800",
      description: "Build healthy habits",
    },
    {
      title: "Analytics",
      icon: "📈",
      screen: "chat",
      color: "#F44336",
      description: "View your progress",
    },
    {
      title: "Voice Journal",
      icon: "🎤",
      screen: "journal",
      color: "#607D8B",
      description: "Record your thoughts",
    },
  ];

  const getAbsoluteAvatarUrl = (
    avatarPath: string | undefined
  ): string | undefined => {
    if (!avatarPath) return undefined;

    // If it's already a full URL, return as is
    if (avatarPath.startsWith("http")) {
      return avatarPath;
    }

    // Handle relative paths (like "/avatars/filename.png")
    if (avatarPath.startsWith("/")) {
      // Remove leading slash if present
      const cleanPath = avatarPath.startsWith("/")
        ? avatarPath.substring(1)
        : avatarPath;
      console.log("🖼️ Clean Avatar Path:", cleanPath);

      // ✅ FIXED: Use the base URL without /api since avatars are served from root
      const absoluteUrl = `${API_BASE_URL.replace("/api", "")}/${cleanPath}`;
      console.log("🖼️ Absolute Avatar URL:", absoluteUrl);
      return absoluteUrl;
    }

    // If it's just a filename, construct the full URL
    const absoluteUrl = `${API_BASE_URL.replace(
      "/api",
      ""
    )}/avatars/${avatarPath}`;
    console.log("🖼️ Absolute Avatar URL from filename:", absoluteUrl);
    return absoluteUrl;
  };

  const avatarUrl = getAbsoluteAvatarUrl(user?.avatar);

  const handleLogout = (): void => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: logout, style: "destructive" },
    ]);
  };

  const getAvatarLabel = (): string => {
    return user?.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U";
  };

  const getMoodDisplay = (): JSX.Element => {
    if (moodLoading) {
      return <ActivityIndicator size="small" color={theme.colors.primary} />;
    }

    if (todayMood) {
      return (
        <View style={styles.moodDisplay}>
          <Text style={styles.moodEmoji}>{todayMood.moodEmoji}</Text>
          <View style={styles.moodDetails}>
            <Text style={styles.moodScore}>
              Score: {todayMood.moodScore}/10
            </Text>
            <Text style={styles.moodNote} numberOfLines={2}>
              {todayMood.note || "No note added"}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.moodPrompt}>
        <Text style={styles.moodPromptText}>How are you feeling today?</Text>
        <TouchableOpacity
          style={styles.logMoodButton}
          onPress={() => router.push("/(screens)/mood-tracker")}
        >
          <Text style={styles.logMoodText}>Log Your Mood</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with Avatar */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <View style={styles.headerLeft}>
              {user?.avatar ? (
                <Avatar.Image
                  size={60}
                  source={avatarUrl ? { uri: avatarUrl } : undefined}
                  label={getAvatarLabel()}
                  style={styles.headerAvatar}
                />
              ) : (
                <Avatar.Text
                  size={60}
                  label={
                    user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "U"
                  }
                  style={styles.headerAvatar}
                />
              )}
              <View style={styles.headerText}>
                <Title style={styles.welcomeText}>
                  Welcome back, {user?.name}!
                </Title>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/(screens)/profile")}
            >
              <Text style={styles.profileButtonText}>Profile</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Today's Mood Card */}
        <Card style={styles.moodCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Today Mood</Title>
            {getMoodDisplay()}
          </Card.Content>
        </Card>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Title style={styles.sectionTitle}>Features</Title>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() =>
                  router.push(("/(screens)/" + feature.screen) as any)
                }
              >
                <Card
                  style={[
                    styles.featureCardInner,
                    { borderTopColor: feature.color },
                  ]}
                >
                  <Card.Content style={styles.featureContent}>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Title style={styles.featureTitle}>{feature.title}</Title>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>This Week</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Moods Logged</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Habits Done</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>7.2</Text>
                <Text style={styles.statLabel}>Avg Mood</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => router.push("/(screens)/mood-tracker")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    marginBottom: 20,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerAvatar: {
    marginRight: 16,
    backgroundColor: "#2196F3",
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  profileButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  moodCard: {
    marginBottom: 20,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  moodDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  moodDetails: {
    flex: 1,
  },
  moodScore: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  moodNote: {
    fontSize: 14,
    color: "#666",
  },
  moodPrompt: {
    alignItems: "center",
    paddingVertical: 8,
  },
  moodPromptText: {
    fontSize: 16,
    marginBottom: 12,
    color: "#666",
  },
  logMoodButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logMoodText: {
    color: "white",
    fontWeight: "bold",
  },
  featuresSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  featureCardInner: {
    borderTopWidth: 4,
    height: 140,
  },
  featureContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
  },
  statsCard: {
    marginBottom: 20,
    elevation: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
