import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { kidColor, kidInitial, type KidProfile } from "@/lib/profile";
import { Colors } from "@/constants/Colors";

type Props = {
  kid: Pick<KidProfile, "name" | "colorIndex">;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function KidAvatar({ kid, size = 56, style }: Props) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: kidColor(kid),
        },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
        {kidInitial(kid.name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  initial: {
    fontFamily: "Fraunces_700Bold",
    color: Colors.white,
  },
});
