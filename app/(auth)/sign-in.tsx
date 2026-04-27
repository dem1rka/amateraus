import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

const SignIn = () => {
  return (
    <View className="items-center gap-4">
      <Text className="text-base">Sign In</Text>

      <CustomButton
        title="SIGN UP"
        style="w-28 h-10"
        textStyle="text-xs"
        onPress={() => router.push("/sign-up")}
      />
    </View>
  );
};

export default SignIn;