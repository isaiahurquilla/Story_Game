import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { saveProfile, loadProfiles, deleteProfile } from '../services/profileService';

export default function Index() {
  const [name, setName] = useState('');
  const [profiles, setProfiles] = useState([]);
  const router = useRouter();

  const openMenu = (profileId) => {
    router.push({
      pathname: '/menu',
      params: { profileId },
    });
  };

  useEffect(() => {
    const getProfiles = async () => {
      const savedList = await loadProfiles();
      setProfiles(savedList);
    };
    getProfiles();
  }, []);

  const handleCreateProfile = async () => {
    if (!name.trim()) return;
    const updatedList = await saveProfile(name);
    setProfiles(updatedList);
    const newProfile = updatedList[updatedList.length - 1];
    setName('');

    if (newProfile) {
      openMenu(newProfile.id);
    }
  };

  const handleDeleteProfile = async (id) => {
    const updatedList = await deleteProfile(id);
    setProfiles(updatedList);
  };

  const renderProfile = ({ item }) => (
    <View style={styles.profileCard}>
      <View style={styles.profileBadge}>
        <Text style={styles.profileBadgeText}>
          {item.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{item.name}</Text>
        <Text style={styles.profileMeta}>Traveler of DreamLand</Text>
        <Text style={styles.currencyText}>💰 {item.currency || 0}</Text>
        <Text style={styles.profileDate}>
          Began {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => openMenu(item.id)}
          style={[styles.actionButton, styles.chooseButton]}
        >
          <Text style={styles.actionText}>Enter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteProfile(item.id)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.background} />

      <View style={styles.header}>
        <Text style={styles.kicker}>A STORY OF STRANGE WELCOMES</Text>
        <Text style={styles.title}>DreamLand</Text>
        <Text style={styles.subtitle}>
          Choose whose story will continue.
        </Text>
      </View>

      <View style={styles.createCard}>
        <Text style={styles.sectionTitle}>Choose Your Name</Text>

        <TextInput
          placeholder="Enter a traveler name"
          placeholderTextColor="#9c8db1"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProfile}>
          <Text style={styles.primaryButtonText}>Begin New Tale</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Existing Tales</Text>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={renderProfile}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tale has begun yet.</Text>
            <Text style={styles.emptyText}>
              Create a profile above to enter the story.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1b1328',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1b1328',
  },
  header: {
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 18,
    alignItems: 'center',
  },
  kicker: {
    color: '#b8a6d9',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: '#f6f0ff',
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#d7caeb',
    fontSize: 15,
    textAlign: 'center',
  },
  createCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#2a1e3b',
    borderWidth: 1,
    borderColor: '#4d3a69',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sectionTitle: {
    color: '#f4ecff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#5f4b7f',
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#f7f1ff',
    borderRadius: 14,
    color: '#241830',
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  listTitle: {
    color: '#f4ecff',
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 22,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1e3b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#4d3a69',
    padding: 16,
    marginBottom: 12,
  },
  profileBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileBadgeText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    paddingRight: 10,
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  profileMeta: {
    color: '#cbbbe6',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  currencyText: {
    color: '#f2cf66',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  profileDate: {
    color: '#aa9ac7',
    fontSize: 12,
  },
  actions: {
    justifyContent: 'center',
  },
  actionButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginVertical: 4,
    alignItems: 'center',
  },
  chooseButton: {
    backgroundColor: '#4c7df0',
  },
  deleteButton: {
    backgroundColor: '#b1435d',
  },
  actionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyCard: {
    marginTop: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#2a1e3b',
    borderWidth: 1,
    borderColor: '#4d3a69',
  },
  emptyTitle: {
    color: '#f4ecff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  emptyText: {
    color: '#cbbbe6',
    lineHeight: 20,
  },
});