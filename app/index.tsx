import { useCallback, useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { LinearGradient } from "@/components/LinearGradientFallback";
import { Colors } from "@/constants/Colors";
import { loadProfile, type StudentProfile } from "@/lib/profile";

export default function WelcomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const saved = await loadProfile();
        if (!active) return;
        setProfile(saved);
        setReady(true);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require("@/assets/images/welcome-children.jpg")}
        style={styles.hero}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(10,40,34,0.08)",
            "rgba(10,40,34,0.22)",
            "rgba(8,32,28,0.94)",
          ]}
          locations={[0, 0.4, 1]}
          style={styles.scrim}
        >
          <View style={styles.copy}>
            <BrandLogo
              size={86}
              showWordmark
              wordmarkColor={Colors.white}
              wordmarkSize={52}
              imageStyle={styles.logoShadow}
            />
            <Text style={styles.headline}>
              Study grows better in the shade of curiosity.
            </Text>
            <Text style={styles.subhead}>
              Practice from your school books — CBSE, ICSE, and Matriculation.
            </Text>

            {ready && (
              <View style={styles.actions}>
                {profile ? (
                  <>
                    <Pressable
                      style={styles.primaryBtn}
                      onPress={() => router.push("/home")}
                    >
                      <Text style={styles.primaryBtnText}>
                        Continue as {profile.name}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={() => router.push("/profile")}
                    >
                      <Text style={styles.secondaryBtnText}>Edit profile</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => router.push("/profile")}
                  >
                    <Text style={styles.primaryBtnText}>
                      Create your profile
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.brandDeep,
  },
  hero: {
    flex: 1,
    width: "100%",
  },
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 72,
  },
  copy: {
    maxWidth: 420,
  },
  logoShadow: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  headline: {
    marginTop: 18,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 26,
    lineHeight: 32,
    color: Colors.white,
  },
  subhead: {
    marginTop: 10,
    fontFamily: "Nunito_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,0.88)",
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 16,
  },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 15,
  },
});
