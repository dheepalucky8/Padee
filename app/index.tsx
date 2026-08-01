import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "@/components/LinearGradientFallback";
import { Colors } from "@/constants/Colors";

const STEPS = [
  {
    n: "01",
    title: "Choose board & grade",
    body: "CBSE, ICSE, or Matriculation — Grades 1 to 8, with subject and difficulty.",
  },
  {
    n: "02",
    title: "Snap the lesson",
    body: "Photograph textbook pages. Padee reads the text and frames practice questions.",
  },
  {
    n: "03",
    title: "Print & practice",
    body: "Share or print an A4 worksheet / question paper with an answer key.",
  },
];

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>Padee</Text>
        <Text style={styles.headline}>
          Turn textbook pages into printable practice.
        </Text>
        <Text style={styles.subhead}>
          Snap a lesson from CBSE, ICSE, or Matriculation books (Grades 1–8),
          then generate Easy, Medium, or Difficult worksheets ready to print.
        </Text>

        <Link href="/create" asChild>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Start creating</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.featureCard}>
        <LinearGradient
          colors={[Colors.brand, Colors.brandDeep]}
          style={styles.featureInner}
        >
          <Text style={styles.featureEyebrow}>From page to paper</Text>
          <Text style={styles.featureTitle}>
            Capture. Frame questions. Print.
          </Text>
          <Text style={styles.featureLine}>
            Built for school study on your phone — photograph the page, pick a
            difficulty, and share a printable sheet.
          </Text>
        </LinearGradient>
      </View>

      <Text style={styles.sectionTitle}>Built for school study at home</Text>
      <Text style={styles.sectionBody}>
        One clear path from your child’s textbook to a printable practice sheet.
      </Text>

      {STEPS.map((step) => (
        <View key={step.n} style={styles.step}>
          <Text style={styles.stepNum}>{step.n}</Text>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepBody}>{step.body}</Text>
        </View>
      ))}

      <View style={styles.ctaBand}>
        <Text style={styles.ctaTitle}>Ready for today’s lesson?</Text>
        <Text style={styles.ctaBody}>
          Create an Easy warm-up, a Medium revision sheet, or a Difficult
          challenge paper in minutes.
        </Text>
        <Link href="/create" asChild>
          <Pressable style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Open Padee</Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.footer}>
        Padee · Matriculation, CBSE & ICSE · Grades 1–8
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 40,
  },
  hero: {
    marginBottom: 28,
  },
  brand: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 56,
    lineHeight: 58,
    color: Colors.brandDeep,
  },
  headline: {
    marginTop: 14,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    color: Colors.ink,
  },
  subhead: {
    marginTop: 12,
    fontFamily: "Nunito_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: Colors.inkSoft,
  },
  primaryBtn: {
    marginTop: 22,
    alignSelf: "flex-start",
    backgroundColor: Colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
  },
  primaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 16,
  },
  featureCard: {
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 32,
  },
  featureInner: {
    padding: 22,
  },
  featureEyebrow: {
    fontFamily: "Nunito_700Bold",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
  },
  featureTitle: {
    marginTop: 10,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    color: Colors.white,
  },
  featureLine: {
    marginTop: 12,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,255,255,0.88)",
  },
  sectionTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 26,
    color: Colors.brandDeep,
  },
  sectionBody: {
    marginTop: 8,
    marginBottom: 18,
    fontFamily: "Nunito_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: Colors.inkSoft,
  },
  step: {
    marginBottom: 18,
  },
  stepNum: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 36,
    color: "rgba(15,107,92,0.18)",
  },
  stepTitle: {
    marginTop: 2,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 20,
    color: Colors.ink,
  },
  stepBody: {
    marginTop: 4,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.inkSoft,
  },
  ctaBand: {
    marginTop: 10,
    backgroundColor: Colors.brand,
    borderRadius: 28,
    padding: 22,
  },
  ctaTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 24,
    color: Colors.white,
  },
  ctaBody: {
    marginTop: 8,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.85)",
  },
  ctaBtn: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ctaBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 15,
  },
  footer: {
    marginTop: 24,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: Colors.inkSoft,
  },
});
