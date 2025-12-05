import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveMessages = async (messages) => {
  try {
    await AsyncStorage.setItem("messages", JSON.stringify(messages));
  } catch (err) {
    console.log("saveMessages error", err);
  }
};

export const loadMessages = async () => {
  try {
    const raw = await AsyncStorage.getItem("messages");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.log("loadMessages error", err);
    return [];
  }
};
