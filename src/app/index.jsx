import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';
import { saveProfile, loadProfiles, deleteProfile } from '../services/profileService';

export default function Index() {
  const [name, setName] = useState('');
  const [profiles, setProfiles] = useState([]);

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
    setName('');
  };

  // Function that handles profile deletion
  const handleDeleteProfile = async (id) => {
    const updatedList = await deleteProfile(id);
    setProfiles(updatedList);
  };

  return (
    <View style={{ padding: 60, flex: 1 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, fontWeight: 'bold' }}>
        Untitled Story Game
      </Text>

      {/* Profile Creation */}
      <View style={{ marginBottom: 40, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
        <Text style={{ fontWeight: '600' }}>Create New Profile</Text>
        <TextInput
          placeholder="Enter Profile Name"
          value={name}
          onChangeText={setName}
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 10, backgroundColor: '#fff' }}
        />
        <Button title="Add Profile" onPress={handleCreateProfile} />
      </View>

      {/* Profile List */}
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Existing Profiles:</Text>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ 
            paddingVertical: 15, 
            borderBottomWidth: 1, 
            borderBottomColor: '#eee',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <View>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: 'gray', fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {/* Delete Button */}
            <TouchableOpacity 
              onPress={() => handleDeleteProfile(item.id)}
              style={{ backgroundColor: '#ff4444', padding: 8, borderRadius: 5 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: 'gray' }}>No profiles found.</Text>}
      />
    </View>
  );
}
