// nodeDefinitions.js

export const NODE_TYPES = {
  BRANCH: 'branch',
  COMPOUND_LOSS: 'compoundLoss',
  LEAF: 'leaf'
};

export const REQUIRED_FIELDS = {
  [NODE_TYPES.BRANCH]: ['id', 'type', 'category', 'nextTrue', 'nextFalse', 'condition'],
  [NODE_TYPES.COMPOUND_LOSS]: ['id', 'type', 'name', 'category', 'nextTrue', 'condition'],
  [NODE_TYPES.LEAF]: ['id', 'type', 'name', 'category']
};

export const NODE_INITIAL_VALUES = {
  [NODE_TYPES.BRANCH]: {
    id: '',
    type: NODE_TYPES.BRANCH,
    category: '',
    nextTrue: '',
    nextFalse: '',
    condition: ''
  },
  [NODE_TYPES.COMPOUND_LOSS]: {
    id: '',
    type: NODE_TYPES.COMPOUND_LOSS,
    name: '',
    category: '',
    nextTrue: '',
    condition: ''
  },
  [NODE_TYPES.LEAF]: {
    id: '',
    type: NODE_TYPES.LEAF,
    name: '',
    category: ''
  }
};
