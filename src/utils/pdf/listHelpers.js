export const createListMarker = (listType, index) => {
  return listType === 'ul' ? '• ' : `${index}. `;
};

export const calculateListIndent = (level) => {
  return 7 * (level + 1);
};

export const processListStart = (token, pushLine, appendToken) => {
  const indent = calculateListIndent(token.level);
  const bullet = createListMarker(token.listType, token.index);
  
  // Return indent first so it can be set before appending bullet
  return {
    pendingIndent: indent,
    bullet: bullet,
    isCurrentListItem: true
  };
};

export const processListEnd = (pushLine, isCurrentListItem) => {
  pushLine(isCurrentListItem);
  return {
    isCurrentListItem: false
  };
};
