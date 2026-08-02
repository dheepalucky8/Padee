import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "@/components/LinearGradientFallback";
import { Colors } from "@/constants/Colors";
import { loadProfile, type StudentProfile } from "@/lib/profile";

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const saved = await loadProfile();
        if (!active) return;
        if (!saved) {
          router.replace("/profile");
          return;
        }
        setProfile(saved);
      })();
      return () => {
        active = false;
      };
    }, [router]),
  );

  if (!profile) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#E8F7F1", Colors.paper, "#F8F4EC"]}
        style={styles.gradient}
      >
        <Text style={styles.brand}>Padee</Text>
        <Text style={styles.hello}>Hello, {profile.name}</Text>
        <Text style={styles.meta}>
          {profile.board} · Grade {profile.grade}
        </Text>
        <Text style={styles.subhead}>
          Ready to turn today’s textbook page into practice?
        </Text>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/create")}
        >
          <Text style={styles.primaryBtnText}>Create worksheet</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.secondaryBtnText}>Edit profile</Text>
        </Pressable>

        <Pressable style={styles.linkBtn} onPress={() => router.replace("/")}>
          <Text style={styles.linkText}>Back to welcome</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  brand: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 42,
    color: Colors.brandDeep,
  },
  hello: {
    marginTop: 18,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 32,
    lineHeight: 38,
    color: Colors.ink,
  },
  meta: {
    marginTop: 8,
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    letterSpacing: 0.4,
    color: Colors.brand,
  },
  subhead: {
    marginTop: 12,
    marginBottom: 28,
    fontFamily: "Nunito_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: Colors.inkSoft,
    maxWidth: 340,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: 18,
  },
  secondaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.brandDeep,
    fontSize: 15,
  },
  linkBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  linkText: {
    fontFamily: "Nunito_700Bold",
    color: Colors.inkSoft,
    fontSize: 14,
  },
});
