import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const gamificationTypes = [
  'xp_reward', 'badge_unlock', 'streak_card', 'level_up', 'challenge_card',
  'daily_goal', 'weekly_goal', 'achievement_card', 'progress_checkpoint',
  'mission_card', 'boss_challenge', 'unlock_next_stage', 'leaderboard_prompt',
  'completion_animation', 'reward_chest', 'skill_tree_unlock',
  'learning_path_checkpoint',
];

export const gamificationBlockDefinitions = createBlockDefinitions(
  blockSpecs('gamification', 'gamification', gamificationTypes, 'Motivation and learning progress block'),
);
