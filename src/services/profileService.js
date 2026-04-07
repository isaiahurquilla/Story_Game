import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILES_KEY = '@profiles_list';

/**
 * Loads the profile list from AsyncStorage
 */
export const loadProfiles = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROFILES_KEY);
    // If data exists, parse it; otherwise return an empty array
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Error loading profiles:", e);
    return [];
  }
};

/**
 * Saves a new profile to the existing list
 */
export const saveProfile = async (name) => {
  try {
    const existingProfiles = await loadProfiles();
    
    const newProfile = { 
      id: Date.now().toString(), // Unique ID for targeting specific profiles
      name: name, 
      createdAt: new Date().toISOString() 
    };
    
    const updatedList = [...existingProfiles, newProfile];
    
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedList));
    return updatedList; // Return the updated list to update the UI state
  } catch (e) {
    console.error("Error saving profile:", e);
    return [];
  }
};

/**
 * Deletes a specific profile by its ID
 */
export const deleteProfile = async (id) => {
  try {
    const existingProfiles = await loadProfiles();
    
    // Creates a new array that ignores existing profiles
    const updatedList = existingProfiles.filter(profile => profile.id !== id);
    
    // Save the filtered list back to AsyncStorage
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedList));
    return updatedList; // Return the updated list to update the UI state
  } catch (e) {
    console.error("Error deleting profile:", e);
    return [];
  }
};

/**
 * Completely wipes all profiles if necessary
 */
export const clearAllProfiles = async () => {
  try {
    await AsyncStorage.removeItem(PROFILES_KEY);
  } catch (e) {
    console.error("Error clearing all profiles:", e);
  }
};
