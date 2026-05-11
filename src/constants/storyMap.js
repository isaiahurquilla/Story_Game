// Aggregates all per-scene dialogue JSON files into one lookup object keyed by scene id
import scene1Story from '../storyData/scene1.json';
import scene2Story from '../storyData/scene2.json';
import scene3Story from '../storyData/scene3.json';
import scene4Story from '../storyData/scene4.json';
import scene5Story from '../storyData/scene5.json';
import scene6Story from '../storyData/scene6.json';
import scene7Story from '../storyData/scene7.json';
import scene8Story from '../storyData/scene8.json';

const storyMap = {
  scene1: scene1Story,
  scene2: scene2Story,
  scene3: scene3Story,
  scene4: scene4Story,
  scene5: scene5Story,
  scene6: scene6Story,
  scene7: scene7Story,
  scene8: scene8Story,
};

export default storyMap;
