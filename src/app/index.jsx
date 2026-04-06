import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { saveProfile, loadProfiles } from '../services/profileService';

export default function Index() {
  const [name, setName] = useState('');
  const [profiles, setProfiles] = useState([]); // Stores the array list of profiles

  // Load all profiles on startuo
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
    setProfiles(updatedList); // Updates UI with list of profiles
    setName(''); // Clear the input field
  };

  return (
    <View style={{ padding: 60, flex: 1 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, fontWeight: 'bold' }}>
        Untitled Story Game
      </Text>

      {/* Create Profile Section */}
      <View style={{ marginBottom: 40, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
        <Text style={{ fontWeight: '600' }}>Create New Profile</Text>
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 10,
            marginVertical: 10,
            backgroundColor: '#fff'
          }}
        />
        <Button title="Add Profile" onPress={handleCreateProfile} />
      </View>

      {/* Profile List */}
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Saved Profiles:</Text>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ 
            padding: 15, 
            borderBottomWidth: 1, 
            borderBottomColor: '#eee',
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
            <Text style={{ fontSize: 16 }}>{item.name}</Text>
            <Text style={{ color: 'gray', fontSize: 12 }}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: 'gray' }}>No profiles found.</Text>}
      />
    </View>
  );
}
