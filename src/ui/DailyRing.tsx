import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "./theme";
export function DailyRing({
  count,
  minutes,
}: {
  count: number;
  minutes: number;
}) {
  const fraction = Math.min(1, count / 10);
  return (
    <View
      style={{ alignItems: "center", gap: 8 }}
      accessibilityLabel={`${count} מילים מתוך יעד של 10 היום, ${minutes} דקות תרגול`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 10, now: Math.min(10, count) }}
    >
      <View
        style={{
          width: 112,
          height: 112,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={112} height={112} style={{ position: "absolute" }}>
          <Circle
            cx={56}
            cy={56}
            r={48}
            fill="none"
            stroke={colors.line}
            strokeWidth={8}
          />
          <Circle
            cx={56}
            cy={56}
            r={48}
            fill="none"
            stroke={colors.purple}
            strokeWidth={8}
            strokeDasharray={`${fraction * 302} 302`}
            strokeLinecap="round"
          transform="rotate(-90 56 56)"
          />
        </Svg>
        <Text style={{ fontSize: 25, fontWeight: "800", color: colors.ink }}>
          {count}/10
        </Text>
      </View>
      <Text style={{ color: colors.muted }}>מילים היום • {minutes} דקות</Text>
      <Text style={{ color: colors.ink }}>
        {count >= 10 || minutes >= 10
          ? "עשיתם דרך יפה היום! אפשר לנוח"
          : "כ־10 דקות, בקצב שלכם"}
      </Text>
    </View>
  );
}
