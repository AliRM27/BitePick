import { View, Text, Platform } from "react-native";
import React from "react";
import { router, Stack } from "expo-router";

const profile = () => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          onPress={() => router.push("/settings")}
          icon={
            Platform.OS === "ios"
              ? "gearshape"
              : require("@/assets/images/gear-icon.png")
          }
          tintColor={"black"}
        />
      </Stack.Toolbar>
      <Text>profile</Text>
    </View>
  );
};

export default profile;
