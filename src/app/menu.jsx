import { useEffect, useState} from "react";
import {View, Text, TouchableOpacity, StyleSheet} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import { getProfileById, loadGameForProfile, deleteGameForProfile } from "../services/profileService";

export default function Menu() {
    const router = useRouter();
    const { profileId } = useLocalSearchParams();

    const selectedProfileId = Array.isArray(profileId) ? profileId[0] : profileId;

    const [profile, setProfile] = useState(null);
    const [saveData, setSaveData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMenuData = async () => {
            if (!selectedProfileId) {
                setLoading(false);
                return;
            }
            
            const foundProfile = await getProfileById(selectedProfileId);
            const foundSave = await loadGameForProfile(selectedProfileId);

            setProfile(foundProfile);
            setSaveData(foundSave);
            setLoading(false);
        };
        loadMenuData();
    }, [selectedProfileId]);

    const handleNewGame = async () => {
        if (!selectedProfileId) return;

        await deleteGameForProfile(selectedProfileId);

        router.push({
            pathname: '/scene1',
            params: { profileId: selectedProfileId, mode: 'new', },
        });
    };

    const handleLoadScene = async (sceneKey) => {
      if (!selectedProfileId) return;
      await deleteGameForProfile(selectedProfileId);
      router.push({
        pathname: `/${sceneKey}`, 
        params: { profileId: selectedProfileId, mode: 'new' },
      });
    };

    const handleLoadGame = () => {
        if (!selectedProfileId || !saveData) return;

        router.push({
            pathname: `/${saveData.sceneId || 'scene1'}`,
            params: { profileId: selectedProfileId, mode: 'load', },
        });
    };

    const goBackToProfiles = () => {
        router.replace('/');
    };

    if (loading) {
        return <View style={styles.container} />;
    }

    if (!profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Profile not found</Text>

                <TouchableOpacity style={styles.secondaryButton} onPress={goBackToProfiles}>
                    <Text style={styles.secondaryButtonText}>Back to Profiles</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
    <View style={styles.container}>
      {/* 🪙 NEW: Currency Badge at the top */}
      <View style={styles.currencyBadge}>
        <Text style={styles.currencyText}>💰 {profile.currency || 0}</Text>
      </View>

      <Text style={styles.title}>Main Menu</Text>
      <Text style={styles.subtitle}>Playing as: {profile.name}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNewGame}>
        <Text style={styles.primaryButtonText}>Start New Game</Text>
      </TouchableOpacity>

      {['scene1', 'scene2'].map((scene) => (
      <TouchableOpacity 
        key={scene}
        style={styles.primaryButton} 
        onPress={() => handleLoadScene(scene)}
      >
        <Text style={styles.primaryButtonText}>Start {scene.toUpperCase()}</Text>
      </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.primaryButton, !saveData && styles.disabledButton]}
        onPress={handleLoadGame}
        disabled={!saveData}
      >
        <Text style={styles.primaryButtonText}>
          {saveData ? 'Load Saved Game' : 'No Saved Game Found'}
        </Text>
      </TouchableOpacity>

      {saveData && (
        <Text style={styles.saveInfo}>
          Last saved: {new Date(saveData.updatedAt).toLocaleString()}
        </Text>
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={goBackToProfiles}>
        <Text style={styles.secondaryButtonText}>Change Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  // 🪙 New style for the currency badge
  currencyBadge: {
    position: 'absolute',
    top: 50,
    right: 32,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  currencyText: {
    fontWeight: 'bold',
    color: '#b8860b',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
  primaryButton: {
    backgroundColor: '#7a4fe0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#b8b8b8',
  },
  saveInfo: {
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7a4fe0',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#7a4fe0',
    fontWeight: 'bold',
  },
});
