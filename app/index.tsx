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
import { loadFamily } from "@/lib/profile";

export default function WelcomeScreen() {
  const router = useRouter();
  const [kidCount, setKidCount] = useState(0);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const family = await loadFamily();
        if (!active) return;
        setKidCount(family.kids.length);
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
                {kidCount > 0 ? (
                  <>
                    <Pressable
                      style={styles.primaryBtn}
                      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                      onPress={() => router.push("/home")}
                    >
                      <Text style={styles.primaryBtnText}>
                        Open family dashboard
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      android_ripple={{ color: "rgba(255,255,255,0.12)" }}
                      onPress={() => router.push("/profile?mode=new")}
                    >
                      <Text style={styles.secondaryBtnText}>Add a child</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={styles.primaryBtn}
                    android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                    onPress={() => router.push("/profile?mode=new")}
                  >
                    <Text style={styles.primaryBtnText}>
                      Add your first child
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
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  primaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 16,
  },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  secondaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 15,
  },
});
