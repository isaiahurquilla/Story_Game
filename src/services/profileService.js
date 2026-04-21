import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILES_KEY = '@profiles_list';
const SAVES_KEY = '@story_saves';
const SERVER_URL = "https://game-server-lxjk.onrender.com/sync";

const syncToCloud = async (action, collectionName, id, data = null) => {
  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, collectionName, id, data }),
    });
    if (!response.ok) {
      console.log("Server received it but had an error");
    }
  } catch (e) {
    console.log("Could not reach the Render server at all.");
  }
};

export const loadProfiles = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROFILES_KEY);
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

export const saveProfile = async (name) => {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) return await loadProfiles();

    const existingProfiles = await loadProfiles();

    const newProfile = {
      id: Date.now().toString(),
      name: trimmedName,
      createdAt: new Date().toISOString(),
      currency: 0, // 🪙 NEW: Initialize currency at 0
    };
    
    const updatedList = [...existingProfiles, newProfile];
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedList));

    syncToCloud("save", "profiles", newProfile.id, newProfile);
    return updatedList;
  } catch (e) {
    console.error("Error saving profile:", e);
    return [];
  }
};

// --- 💰 NEW CURRENCY LOGIC ---

/**
 * Adds currency and syncs to cloud
 */
export const addCurrency = async (profileId, amount) => {
  try {
    const profiles = await loadProfiles();
    let updatedProfile = null;

    const updatedList = profiles.map(p => {
      if (p.id === profileId) {
        updatedProfile = { ...p, currency: (p.currency || 0) + amount };
        return updatedProfile;
      }
      return p;
    });

    if (updatedProfile) {
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedList));
      syncToCloud("save", "profiles", profileId, updatedProfile);
    }
    return updatedList;
  } catch (e) {
    console.error("Error adding currency:", e);
  }
};

/**
 * Checks balance and spends if possible
 */
export const spendCurrency = async (profileId, amount) => {
  try {
    const profiles = await loadProfiles();
    let success = false;
    let updatedProfile = null;

    const updatedList = profiles.map(p => {
      if (p.id === profileId && (p.currency || 0) >= amount) {
        success = true;
        updatedProfile = { ...p, currency: p.currency - amount };
        return updatedProfile;
      }
      return p;
    });

    if (success) {
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedList));
      syncToCloud("save", "profiles", profileId, updatedProfile);
    }
    return success;
  } catch (e) {
    console.error("Error spending currency:", e);
    return false;
  }
};

// --- END NEW CURRENCY LOGIC ---

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
    const updatedSave = { ...saveData, updatedAt: new Date().toISOString() };
    const updatedSaves = { ...allSaves, [profileId]: updatedSave };

    await AsyncStorage.setItem(SAVES_KEY, JSON.stringify(updatedSaves));
    syncToCloud("save", "saves", profileId, updatedSave);
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
      syncToCloud("delete", "saves", profileId);
    }
  } catch (e) {
    console.error('Error deleting saved game:', e);
  }
};

export const deleteProfile = async (id) => {
  try {
    const existingProfiles = await loadProfiles();
    const updatedList = existingProfiles.filter(profile => profile.id !== id);
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedList));
    await deleteGameForProfile(id);
    syncToCloud("delete", "profiles", id);
    return updatedList;
  } catch (e) {
    console.error("Error deleting profile:", e);
    return [];
  }
};

export const clearAllProfiles = async () => {
  try {
    await AsyncStorage.removeItem(PROFILES_KEY);
  } catch (e) {
    console.error("Error clearing all profiles:", e);
  }
};