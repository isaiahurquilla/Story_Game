import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function Index() {
  // Holds onto the user name
  const [name, setName] = useState('');

  /*
    This function logs the name only but doesn't save profiles just yet.
  */
  const handleCreateProfile = () => {
    console.log('Profile name entered:', name);
  };

  return (
    <View style={{ padding: 100 }}>
      {/* Game Title */}
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Untitled Story Driven Game
      </Text>

      {/* Section title */}
      <Text>Create Your Profile</Text>

      {/* Player Name Input */}
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{
          borderWidth: 1,
          padding: 8,
          marginVertical: 10,
        }}
      />

      {/* Create profile button that doesn't press for now */}
      <Button title="Create Profile" onPress={handleCreateProfile} />
    </View>
  );
}
