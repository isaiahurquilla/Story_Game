import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import WorldScene from '../screens/WorldScene';

const SceneRoute = () => {
  const router = useRouter();
  const { profileId, mode, sceneId } = useLocalSearchParams();
  const selectedProfileId = Array.isArray(profileId) ? profileId[0] : profileId;
  const selectedSceneId = Array.isArray(sceneId) ? sceneId[0] : sceneId;

  return (
    <WorldScene
      sceneId={selectedSceneId}
      profileId={selectedProfileId}
      mode={mode}
      onGoToMenu={() => {
        router.replace({
          pathname: '/menu',
          params: { profileId: selectedProfileId },
        });
      }}
      onChangeScene={(nextSceneId) => {
        router.replace({
          pathname: `/${nextSceneId}`,
          params: { profileId: selectedProfileId, mode: 'new' },
        });
      }}
    />
  );
};

export default SceneRoute;