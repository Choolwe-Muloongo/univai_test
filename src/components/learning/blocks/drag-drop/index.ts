import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const dragDropTypes = [
  'drag_drop_match', 'drag_drop_sort', 'drag_drop_sequence', 'drag_drop_label',
  'drag_drop_grouping', 'reorder_steps', 'build_flowchart', 'mind_map_activity',
  'card_sort', 'timeline_ordering', 'category_drop', 'sentence_ordering',
  'process_ordering', 'diagram_label_drop', 'code_ordering', 'account_sorting',
];

export const dragDropBlockDefinitions = createBlockDefinitions(
  blockSpecs('drag-drop', 'drag-drop', dragDropTypes, 'Drag-and-drop and ordering block'),
);
