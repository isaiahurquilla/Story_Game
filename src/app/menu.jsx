import { useEffect, useState} from "react";
import {View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import { getProfileById, loadGameForProfile, deleteGameForProfile } from "../services/profileService";

const AVAILABLE_SCENES = [
  { key: 'scene1', label: 'Scene 1' },
  { key: 'scene2', label: 'Scene 2' },
];

export default function Menu() {
    const router = useRouter();
    const { profileId } = useLocalSearchParams();

    const selectedProfileId = Array.isArray(profileId) ? profileId[0] : profileId;

    const [profile, setProfile] = useState(null);
    const [saveData, setSaveData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sceneModalVisible, setSceneModalVisible] = useState(false);

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
    // clear progress if jumping to a specific scene
      await deleteGameForProfile(selectedProfileId);
      router.push({
        // Use backticks and ${} to insert the sceneKey
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
        style={styles.primaryButton}
        onPress={() => setSceneModalVisible(true)}
      >
        <Text style={styles.primaryButtonText}>Select Scene</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, !saveData && styles.disabledButton]}
        onPress={handleLoadGame}
        disabled={!saveData}
      >
        <Text style={styles.primaryButtonText}>
          {saveData ? "Load Saved Game" : "No Saved Game Found"}
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

      <Modal
        visible={sceneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSceneModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSceneModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Choose a Scene</Text>

            {AVAILABLE_SCENES.map((scene) => (
             <TouchableOpacity
              key={scene.key}
             style={styles.modalSceneButton}
             onPress={() => handleLoadScene(scene.key)}
            >
            <Text style={styles.modalSceneButtonText}>{scene.label}</Text>
           </TouchableOpacity>
          ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setSceneModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  },modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalSceneButton: {
    backgroundColor: "#7a4fe0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  modalSceneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalCancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  modalCancelButtonText: {
    color: "#7a4fe0",
    fontWeight: "bold",
  },
});
