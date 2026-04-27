import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

const SignUp = () => {
  return (
    <View className="items-center gap-4">
      <Text className="text-base">Sign Up</Text>

      <CustomButton
        title="SIGN IN"
        style="w-28 h-10"
        textStyle="text-xs"
        onPress={() => router.push("/sign-in")}
      />
    </View>
  );
};

export default SignUp;