import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";

export function LinearGradient(
  props: ComponentProps<typeof ExpoLinearGradient>,
) {
  return <ExpoLinearGradient {...props} />;
}
