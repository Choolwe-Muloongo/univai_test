import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const writingTypes = [
  'sentence_builder', 'grammar_correction', 'punctuation_activity', 'rewrite_activity',
  'tone_adjustment', 'reading_comprehension', 'vocabulary_match', 'synonym_match',
  'antonym_match', 'essay_planner', 'paragraph_builder', 'thesis_statement_builder',
  'argument_builder', 'counterargument_activity', 'speech_builder', 'dialogue_practice',
  'translation_activity', 'summarization_activity', 'email_writing_activity',
  'letter_writing_activity', 'report_writing_activity', 'news_article_builder',
  'interview_question_activity', 'headline_builder', 'story_structure_activity',
  'editing_activity', 'proofreading_activity', 'public_speaking_prompt',
  'debate_prompt', 'listening_comprehension',
];

export const writingBlockDefinitions = createBlockDefinitions(
  blockSpecs('writing', 'writing', writingTypes, 'Writing, language, and communication block'),
);
