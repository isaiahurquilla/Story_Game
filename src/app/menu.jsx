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
            pathname: '/scene2',
            params: { profileId: selectedProfileId, mode: 'new', },
        });
    };

    const handleLoadGame = () => {
        if (!selectedProfileId || !saveData) return;

        router.push({
            pathname: `/${saveData.sceneId || 'scene2'}`,
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

                <TouchableOpacity style={styles.secondarybutton} onPress={goBackToProfiles}>
                    <Text style={styles.secondaryButtonText}>Back to Profiles</Text>
                </TouchableOpacity>
            </View>
        );
    }
    return (
    <View style={styles.container}>
      <Text style={styles.title}>Main Menu</Text>
      <Text style={styles.subtitle}>Profile: {profile.name}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNewGame}>
        <Text style={styles.primaryButtonText}>Start New Game</Text>
      </TouchableOpacity>

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
  },
  secondaryButtonText: {
    color: '#7a4fe0',
    fontWeight: 'bold',
  },
});
