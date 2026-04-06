import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILES_KEY = '@profiles_list';

// Saves a new profile to the existing list
export const saveProfile = async (name) => {
  try {
    const existingProfiles = await loadProfiles();
    const newProfile = { 
      id: Date.now().toString(), // Unique ID for lists
      name, 
      createdAt: new Date().toISOString() 
    };
    
    const updatedList = [...existingProfiles, newProfile];
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedList));
    
    return updatedList;
  } catch (e) {
    console.error("Error saving profile", e);
    return [];
  }
};

// Load the entire list of profiles
export const loadProfiles = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROFILES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Error loading profiles", e);
    return [];
  }
};
