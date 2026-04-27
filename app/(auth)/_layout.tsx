import { Slot } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function _Layout() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="items-center pt-4">
        <Text className="mt-6 text-base">Layout Auth</Text>
      </View>

      <View className="flex-1 justify-center px-8">
        <Slot />
      </View>
    </SafeAreaView>
  );
}