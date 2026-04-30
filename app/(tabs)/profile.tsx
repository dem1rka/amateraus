import CustomButton from "@/components/CustomButton";
import CustomHeader from "@/components/CustomHeader";
import { images } from "@/constants";
import { account } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";
import { ProfileFieldProps } from "@/type";
import { router } from "expo-router";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileField = ({ label, value, icon }: ProfileFieldProps) => (
  <View className="flex-row items-center gap-4 p-4 border border-gray-200 rounded-2xl bg-white">
    <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
      <Image source={icon} className="size-5" resizeMode="contain" />
    </View>

    <View className="flex-1">
      <Text className="small-medium text-gray-200">{label}</Text>
      <Text className="base-semibold text-dark-100 mt-1">{value}</Text>
    </View>
  </View>
);

const Profile = () => {
  const { user, setIsAuthenticated, setUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setIsAuthenticated(false);
      router.replace("/sign-in");
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-5">
          <CustomHeader title="Profile" />

          <View className="items-center mt-8">
            <Image
              source={user?.avatar ? { uri: user.avatar } : images.avatar}
              className="w-28 h-28 rounded-full"
              resizeMode="cover"
            />

            <Text className="h2-bold text-dark-100 mt-4">
              {user?.name || "Guest User"}
            </Text>

            <Text className="paragraph-medium text-gray-200 mt-1">
              {user?.email || "No email available"}
            </Text>
          </View>

          <View className="mt-8 gap-4">
            <ProfileField
              label="Full Name"
              value={user?.name || "Not provided"}
              icon={images.person}
            />

            <ProfileField
              label="Email Address"
              value={user?.email || "Not provided"}
              icon={images.envelope}
            />

            <ProfileField
              label="Phone Number"
              value="+7 771 67 676"
              icon={images.phone}
            />

            <ProfileField
              label="Delivery Address"
              value="67 D. Kolbasenk street, Petropavlovsk"
              icon={images.location}
            />
          </View>

          <View className="mt-8">
            <CustomButton
              title="Log Out"
              onPress={handleLogout}
              leftIcon={
                <Image
                  source={images.logout}
                  className="size-5 mr-2"
                  resizeMode="contain"
                />
              }
              style="bg-red-500"
              textStyle="text-white"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;