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

// Auto Login Functions
export const saveCredentials = async (email, password) => {
  try {
    await AsyncStorage.setItem("userCredentials", JSON.stringify({ email, password }));
  } catch (err) {
    console.log("saveCredentials error", err);
  }
};

export const loadCredentials = async () => {
  try {
    const raw = await AsyncStorage.getItem("userCredentials");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.log("loadCredentials error", err);
    return null;
  }
};

export const clearCredentials = async () => {
  try {
    await AsyncStorage.removeItem("userCredentials");
  } catch (err) {
    console.log("clearCredentials error", err);
  }
};
