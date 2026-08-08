import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import { Colors } from "@/constants/Colors";

type Props = {
  size?: number;
  showWordmark?: boolean;
  wordmarkColor?: string;
  wordmarkSize?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function BrandLogo({
  size = 72,
  showWordmark = true,
  wordmarkColor = Colors.brandDeep,
  wordmarkSize = 34,
  style,
  imageStyle,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      <Image
        source={require("@/assets/images/padee-logo.png")}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size * 0.28,
          },
          imageStyle,
        ]}
        resizeMode="cover"
        accessibilityLabel="Padee logo"
      />
      {showWordmark ? (
        <Text style={[styles.wordmark, { color: wordmarkColor, fontSize: wordmarkSize }]}>
          Padee
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wordmark: {
    fontFamily: "Fraunces_700Bold",
    letterSpacing: -0.5,
  },
});
