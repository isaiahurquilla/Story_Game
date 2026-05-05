PROJECT PROPOSAL & DEVELOPMENT PROCESS DOCUMENT
Team Name: [Team Dreamland]
Team Members: Isaiah Urquilla, Nebo Paul, Joshua Williams
Project Name: [ Dreamland ]
Category: Entertainment & Gaming


====================
SECTION 1: PROJECT PROPOSAL
====================


1.1 Project Vision & User Problem
  - What problem does your app solve?
  The project is a short narrative-driven game that combines visual novel scenes with an overworld exploration layer, giving players a compact story experience with interactive movement and collectible progression.
  - Who is your target user?
  Players who enjoy indie-style story games, visual novel pacing, and lightweight 2D adventure mechanics on mobile or web via Expo.
  - Why does this app need to exist?
  It provides a playable demo for a story-focused game with narrative choice, profile persistence, and world exploration, while demonstrating React Native game-style UI and local save/load functionality.


1.2 Core Features (MVP)
  - Feature 1: Save and load progress using local async storage with optional cloud sync hooks.
  - Feature 2: Visual novel style dialog system with portrait-focused scenes and player choices.
  - Feature 3: Overworld style 2D map scenes with a scrolling camera and scene-specific world layouts.
  - Feature 4: Player movement using keyboard/game controls in gameplay scenes.
  - Feature 5: Interactable objects and NPC prompts in the overworld that launch scenes.
  - Feature 6: Animated character portraits and walk animations.
  - Feature 7: Collectible in-game currency tracked per player profile.
  - Feature 8: Custom 2D art assets, character sprites, backgrounds, and JSON-driven scenes.


1.3 Technical Stack
  - Frontend: React Native + Expo with expo-router for scene navigation.
  - Database: MongoDB connection.
  - Libraries: React Native Reanimated, Async Storage, Safe Area Context, React Native Screens.
  - Persistence: AsyncStorage for profiles and save state.
  - Additional services: Remote sync endpoint integration via a Render-hosted sync service in profileService.js.


1.4 Data Model
  - Profile (MongoDB collection: profiles)
      - id: string (unique profile ID)
      - name: string (player name)
      - createdAt: string (ISO timestamp)
      - currency: number (in-game currency)
      Sample: {"id": "1776806170387", "name": "Stygian", "createdAt": "2026-04-21T21:16:10.387Z", "currency": 600}
  - SaveState (MongoDB collection: saves)
      - id: string (save ID, matches profileId)
      - sceneId: string (current scene)
      - updatedAt: string (ISO timestamp)
      - currentNode: string|null (current dialogue node)
      - history: array of strings (dialogue history)
      - playerPos: object {x, y} (player position)
      - npcPositions: array of objects (NPC positions and states)
      - leaderState: object {active, finished} (leader NPC state)
      - claimedRewards: array (claimed rewards)
      Sample: {"id": "1777786877117", "sceneId": "scene3", "updatedAt": "2026-05-03T05:43:44.678Z", "currentNode": null, "history": ["What just happened?"], "playerPos": {"x": 180, "y": 620}, "npcPositions": [{"id": "pink", "x": 760, "y": 420, "interactionNode": "start"}], "leaderState": {"active": false, "finished": false}, "claimedRewards": []}
  - Story/world data is stored as JSON files per scene, including dialogue nodes, world objects, NPC positions, and scene configurations.


1.5 Success Criteria
  - By end of 8 weeks, we will have:
  - A playable demo with profile creation and scene navigation.
  - Local save/load progress working for multiple profiles.
  - A mixed visual novel + overworld gameplay loop implemented.
  - Demonstrated use of Expo/React Native and persistent data storage.


====================
SECTION 2: SPRINT RETROSPECTIVE SUMMARY (Completed throughout + final summary)
====================


2.1 Sprint Structure
  - Did you use 1-week, 2-week, or rolling sprints?
  1 week
  - How often did you meet?
  Weekly, with dedicated syncs for planning and reviewing progress.
  - How did you manage tasks? (Jira, GitHub Issues, Trello, Linear, etc.)
  We used a Trello board and GitHub branches to assign and track work during weekly meetings.


2.2 What Went Well
  - Dividing work by backend integration, code structure, and content creation helped the team move in parallel.
  - Weekly syncs kept everyone aligned on features, scene flow, and bug fixes.
  - Using JSON-driven scene and character data made content updates faster without changing game logic.


2.3 What Was Challenging
  - Git coordination and merges became difficult when multiple developers edited the same files or branches at once.
  - Implementing the JSON-driven scene structure, save/load state, and profile persistence required careful debugging.
  - Overworld interaction and collision logic took extra time to tune across different world scenes.
  - Balancing feature ambition with the demo timeline meant we had to cut or postpone some polish work.


2.4 Key Decisions & Pivots
  - Decision: Use JSON data for characters, dialogue, and scene layout | Outcome: easier separation of content and game logic.


  - Pivot: Originally planning a menu-based visual novel only experience | Reason: expanded scope to a playable overworld with interactable objects and NPC prompts.


  - Decision: Persist profile and save data locally with AsyncStorage | Outcome: players can create profiles and resume progress across sessions.
   - Pivot: Added a remote sync endpoint for backup | Reason: keep local saves primary while allowing cloud sync hooks for data recovery.


2.5 Final Reflection
  - How close are you to your MVP?
  We are close to MVP: profile creation, save/load progress, narrative scenes, and overworld gameplay are implemented, with remaining polish needed around content, animation, and world interaction.
  - What would you do differently?
  Assign more specific coding tasks earlier, define scene and file structure sooner, and keep the scope narrower until the core gameplay loop was stable.
  - What are you most proud of?
  Completing a playable experience that combines visual novel storytelling with interactive overworld scenes, while also delivering robust profile and save functionality.


====================
SECTION 3: ARCHITECTURAL DECISIONS (Completed as project evolves)
====================


3.1 Authentication & Authorization
  - How are users authenticated?
  No user authentication; profiles are created locally without login.
  - Any role-based access control?
  None; all users have equal access to their own profiles and saves.




3.2 Data Persistence
  - How are you persisting data?
  Local data is stored in AsyncStorage for profiles and save states. Optional cloud sync sends data to MongoDB Atlas collections ('profiles' and 'saves') via a Render-hosted endpoint, using actions like 'save' and 'delete'.
  - Why did you choose this database?
  MongoDB Atlas for flexible document storage and cloud hosting; AsyncStorage for offline-first local persistence in React Native. The hybrid approach ensures data recovery without requiring constant connectivity.
  - Any offline-first considerations?
  Yes; the app works fully offline with local storage as primary, and cloud sync as optional backup. Profiles and saves are synced on creation/update, but the app functions without internet.


3.3 State Management
  - How are you managing app state? (Redux, Context, Zustand, etc.)
  React component state and props; no global state management library used.
  - Why did you choose this approach?
  Simple app structure with scene-based navigation made local state sufficient without added complexity.


3.4 API Design (if applicable)
  - How are you structuring API endpoints?
  Single sync endpoint: POST to https://game-server-lxjk.onrender.com/sync with JSON payload {action: 'save'|'delete', collectionName: 'profiles'|'saves', id, data}.
  - Any caching or optimization strategies?
  No caching; sync is on-demand for saves and profile updates, with local AsyncStorage as the cache. Data is sent immediately on changes for backup.


====================
SECTION 4: TEAM CONTRIBUTIONS
====================


4.1 Role Assignments
   - Nebo Paul: Project lead and base structure developer.
   - Isaiah Urquilla: Overworld developer and scene builder.
   - Joshua Williams: Backend management and story coordinator.


4.2 Contribution Summary
   - Nebo Paul: X commits, Y pull requests, Z features.
     Major contributions: Started visual novel components, JSON structure for characters/scenes, UI polish, managed meetings, documentation, and Trello board.
   - Isaiah Urquilla: X commits, Y pull requests, Z features.
     Major contributions: Created overworld scene logic, overworld dialog logic, main menu, player movement, animations, gathered assets, and story writing.
   - Joshua Williams: X commits, Y pull requests, Z features.
     Major contributions: Created backend connection, Async storage hook, profile logic, save/load logic, currency system, gathered assets, and story writing.


4.3 Code Review & Collaboration
 - How many pull requests were reviewed?
 - Any patterns in code quality or review feedback?


====================





