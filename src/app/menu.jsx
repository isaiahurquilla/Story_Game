import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getProfileById,
  loadGameForProfile,
  deleteGameForProfile,
} from '../services/profileService';

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
      params: { profileId: selectedProfileId, mode: 'new' },
    });
  };

  const handleLoadScene = async (sceneKey) => {
    if (!selectedProfileId) return;

    await deleteGameForProfile(selectedProfileId);
    setSceneModalVisible(false);

    router.push({
      pathname: `/${sceneKey}`,
      params: { profileId: selectedProfileId, mode: 'new' },
    });
  };

  const handleLoadGame = () => {
    if (!selectedProfileId || !saveData) return;

    router.push({
      pathname: `/${saveData.sceneId || 'scene1'}`,
      params: { profileId: selectedProfileId, mode: 'load' },
    });
  };

  const goBackToProfiles = () => {
    router.replace('/');
  };

  if (loading) {
    return <SafeAreaView style={styles.screen} />;
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerCard}>
          <Text style={styles.title}>No Traveler Found</Text>
          <Text style={styles.subtitle}>Return and choose another profile.</Text>

          <TouchableOpacity style={styles.secondaryButton} onPress={goBackToProfiles}>
            <Text style={styles.secondaryButtonText}>Back to Profiles</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.overline}>CURRENT TALE</Text>
        <Text style={styles.title}>DreamLand</Text>
        <Text style={styles.subtitle}>Traveler: {profile.name}</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {profile.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>

        <View style={styles.profileTextWrap}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileMeta}>The story awaits your next step.</Text>
          <Text style={styles.currencyText}>💰 {profile.currency || 0}</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNewGame}>
          <Text style={styles.primaryButtonText}>Begin New Tale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSceneModalVisible(true)}
        >
          <Text style={styles.primaryButtonText}>Choose Chapter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, !saveData && styles.disabledButton]}
          onPress={handleLoadGame}
          disabled={!saveData}
        >
          <Text style={styles.primaryButtonText}>
            {saveData ? 'Continue Saved Tale' : 'No Saved Tale Found'}
          </Text>
        </TouchableOpacity>

        {saveData && (
          <View style={styles.savePanel}>
            <Text style={styles.saveLabel}>Last remembered moment</Text>
            <Text style={styles.saveInfo}>
              {new Date(saveData.updatedAt).toLocaleString()}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={goBackToProfiles}>
          <Text style={styles.secondaryButtonText}>Change Traveler</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={styles.modalTitle}>Choose a Chapter</Text>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1b1328',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  hero: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  overline: {
    color: '#b8a6d9',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: '#f6f0ff',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#d7caeb',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  centerCard: {
    marginTop: 120,
    borderRadius: 18,
    padding: 22,
    backgroundColor: '#2a1e3b',
    borderWidth: 1,
    borderColor: '#4d3a69',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1e3b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#4d3a69',
    padding: 16,
    marginBottom: 16,
  },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  badgeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileMeta: {
    color: '#cbbbe6',
    fontSize: 13,
    marginTop: 3,
    marginBottom: 5,
  },
  currencyText: {
    color: '#f2cf66',
    fontWeight: '700',
  },
  menuCard: {
    backgroundColor: '#2a1e3b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#4d3a69',
    padding: 18,
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    backgroundColor: '#65587a',
  },
  savePanel: {
    backgroundColor: '#20162f',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  saveLabel: {
    color: '#b8a6d9',
    fontSize: 12,
    marginBottom: 4,
  },
  saveInfo: {
    color: '#f3ecff',
    fontSize: 14,
  },
  secondaryButton: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  secondaryButtonText: {
    color: '#d9c8ff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 7, 16, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#2a1e3b',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4d3a69',
  },
  modalTitle: {
    color: '#f6f0ff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSceneButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSceneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelButtonText: {
    color: '#d9c8ff',
    fontWeight: '700',
  },
});