import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const mediaTypes = [
  'image_card', 'image_labeling', 'hotspot_image', 'before_after_image', 'diagram',
  'infographic', 'audio_card', 'audio_question', 'video_embed', 'video_checkpoint',
  'slideshow', 'pdf_snippet', 'document_viewer', 'file_download', 'resource_link',
  'gallery', 'interactive_image', 'annotated_image', 'map_activity', 'timeline_media',
];

export const mediaBlockDefinitions = createBlockDefinitions(
  blockSpecs('media', 'media', mediaTypes, 'Media, image, audio, document, or map block'),
);
