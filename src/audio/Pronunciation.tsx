import React, { useEffect, useState } from "react";
import { View, Text, Pressable, AppState } from "react-native";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { useIsFocused } from "@react-navigation/native";
import { audio } from "../data/audio";
import { colors } from "../ui/theme";

export function Pronunciation({
  wordId,
  onHeard,
}: {
  wordId: string;
  onHeard?: () => void;
}) {
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState(false);
  const source = audio[wordId]?.[slow ? "slow" : "normal"];
  const player = useAudioPlayer(source ?? null, { downloadFirst: true });
  const status = useAudioPlayerStatus(player);
  const focused = useIsFocused();
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() =>
      setError(true),
    );
  }, []);
  useEffect(() => {
    if (!focused) player.pause();
  }, [focused, player]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
    });
    return () => subscription.remove();
  }, [player]);
  useEffect(() => {
    setError(false);
  }, [source]);
  useEffect(() => {
    if (status.playing) onHeard?.();
  }, [status.playing]);
  const play = async () => {
    try {
      setError(false);
      await player.seekTo(0);
      player.play();
    } catch {
      setError(true);
    }
  };
  return (
    <View style={{ gap: 8, alignItems: "center" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="השמעת המילה"
        disabled={!status.isLoaded}
        onPress={() => void play()}
        style={{
          backgroundColor: colors.mint,
          padding: 14,
          borderRadius: 16,
          opacity: status.isLoaded ? 1 : 0.5,
        }}
      >
        <Text style={{ color: colors.green, fontWeight: "700" }}>
          {status.playing ? "מנגן… אפשר לשמוע שוב" : "▶ לשמוע את המילה"}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: slow }}
        onPress={() => {
          player.pause();
          setSlow((v) => !v);
        }}
        style={{ padding: 10 }}
      >
        <Text style={{ color: colors.purple }}>
          {slow ? "קצב: איטי • לעבור לרגיל" : "קצב: רגיל • לעבור לאיטי"}
        </Text>
      </Pressable>
      {(error || status.error || !source) && (
        <Text accessibilityLiveRegion="polite">
          הקול לא זמין כרגע. אפשר להמשיך עם מילים כתובות.
        </Text>
      )}
    </View>
  );
}
