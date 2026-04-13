import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
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

  // Function that handles profile deletion
  const handleDeleteProfile = async (id) => {
    const updatedList = await deleteProfile(id);
    setProfiles(updatedList);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Untitled Story Game</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create New Profile</Text>

        <TextInput
          placeholder="Enter Profile Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProfile}>
          <Text style={styles.primaryButtonText}>Add Profile</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Existing Profiles:</Text>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.profileRow}>
            <View>
              <Text style={styles.profileName}>{item.name}</Text>
              <Text style={styles.profileDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => openMenu(item.id)}
                style={[styles.actionButton, styles.chooseButton]}
              >
                <Text style={styles.actionText}>Choose</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteProfile(item.id)}
                style={[styles.actionButton, styles.deleteButton]}
              >
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No profiles found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#7a4fe0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
  },
  profileRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 16,
  },
  profileDate: {
    color: 'gray',
    fontSize: 12,
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  chooseButton: {
    backgroundColor: '#4a90e2',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyText: {
    color: 'gray',
    marginTop: 10,
  },
});