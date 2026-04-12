import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILES_KEY = '@profiles_list';
const SAVES_KEY = '@story_saves';

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

export const getProfileById = async (id) => {
  try {
    const profiles = await loadProfiles();
    return profiles.find((profile) => profile.id === id) ?? null;
  } catch (e) {
    console.error('Error finding profile:', e);
    return null;
  }
};

/**
 * Saves a new profile to the existing list
 */
export const saveProfile = async (name) => {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) return await loadProfiles();

    const existingProfiles = await loadProfiles();

    const newProfile = {
      id: Date.now().toString(),
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };
    
    const updatedList = [...existingProfiles, newProfile];
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedList));

    return updatedList; // Return the updated list to update the UI state
  } catch (e) {
    console.error("Error saving profile:", e);
    return [];
  }
};
const loadAllSaves = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SAVES_KEY);
       return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (e) {
    console.error('Error loading saves:', e);
    return {};
  }
};

export const saveGameForProfile = async (profileId, saveData) => {
  try {
    const allSaves = await loadAllSaves();

    const updatedSave = {
      ...saveData,
      updatedAt: new Date().toISOString(),
    };

    const updatedSaves = {
      ...allSaves,
      [profileId]: updatedSave,
    };

    await AsyncStorage.setItem(SAVES_KEY, JSON.stringify(updatedSaves));
    return updatedSave;
  } catch (e) {
    console.error('Error saving game:', e);
    return null;
  }
};

export const loadGameForProfile = async (profileId) => {
  try {
    const allSaves = await loadAllSaves();
    return allSaves[profileId] ?? null;
  } catch (e) {
    console.error('Error loading game:', e);
    return null;
  }
};

export const deleteGameForProfile = async (profileId) => {
  try {
    const allSaves = await loadAllSaves();

    if (allSaves[profileId]) {
      delete allSaves[profileId];
      await AsyncStorage.setItem(SAVES_KEY, JSON.stringify(allSaves));
    }
  } catch (e) {
    console.error('Error deleting saved game:', e);
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
    await deleteGameForProfile(id); // Also delete any associated saved game data
    
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
