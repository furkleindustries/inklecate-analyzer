import {
  MaterialTableProps,
} from 'material-table';

export const AnalyzerDisplayColumns: MaterialTableProps<any>['columns'] = [
  {
    field: 'id',
    title: 'ID',
  },

  {
    defaultSort: 'desc',
    field: 'occurrences',
    title: 'Occurrences',
    type: 'numeric',
  },

  {
    field: 'visits',
    title: 'Visited nodes',
    type: 'numeric',
  },

  {
    field: 'wordCount',
    title: 'Word count',
    type: 'numeric',
  },

  {
    field: 'characterCount',
    title: 'Character count',
    type: 'numeric',
  },

  {
    field: 'stateChanges',
    title: 'State changes',
    type: 'numeric',
  },
];
