
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@user_profile';

// Saves the profile
export const saveProfile = async (name) => {
  try {
    const newProfile = { name, createdAt: new Date().toISOString() };
    const jsonValue = JSON.stringify(newProfile);
    await AsyncStorage.setItem(PROFILE_KEY, jsonValue);
    return newProfile;
  } catch (e) {
    console.error("Error saving profile", e);
    return null;
  }
};

// Loads the profile
export const loadProfile = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROFILE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Error loading profile", e);
    return null;
  }
};

// Clear profile (for testing)
export const clearProfile = async () => {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
  } catch (e) {
    console.error("Error clearing profile", e);
  }
};
