export const createListMarker = (listType, index) => {
  return listType === 'ul' ? '• ' : `${index}. `;
};

export const calculateListIndent = (level) => {
  return 6 * (level + 1);
};

export const processListStart = (token, pushLine, appendToken) => {
  pushLine();
  const pendingIndent = calculateListIndent(token.level);
  const bullet = createListMarker(token.listType, token.index);
  appendToken(bullet, { bold: false, italic: false, underline: false });
  
  return {
    pendingIndent,
    isCurrentListItem: true
  };
};

export const processListEnd = (pushLine, isCurrentListItem) => {
  pushLine(isCurrentListItem);
  return {
    isCurrentListItem: false
  };
};
