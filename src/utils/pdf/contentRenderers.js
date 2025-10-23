export const createImageRenderer = (doc, pageHeight, margin, drawPageBorder, config) => {
  return async (imageData, imageHeight, currentY) => {
    // Add configurable space before the image
    currentY += config.spacing.beforeImage || 0;

    if (currentY + imageHeight > pageHeight - margin) {
      doc.addPage();
      drawPageBorder();
      currentY = margin + config.spacing.topPageMargin + (config.spacing.beforeImage || 0);
    }

    const img = new Image();
    img.src = imageData;
    
    await new Promise((resolve) => {
      img.onload = () => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const aspectRatio = img.width / img.height;
        const imageWidth = imageHeight * aspectRatio;
        const xPos = (pageWidth - imageWidth) / 2;
        
        doc.addImage(imageData, 'JPEG', xPos, currentY, imageWidth, imageHeight);
        resolve();
      };
      img.onerror = () => resolve();
    });

    return currentY + imageHeight;
  };
};

export const createTableRenderer = (doc, pageHeight, margin, contentWidth, drawPageBorder, config) => {
  return (tableData, tableCols, currentY) => {
    // Add configurable space before the table
    currentY += config.spacing.beforeTable || 0;

    const tableWidth = contentWidth * (config.table.widthPercentage || 0.7);
    const colWidth = tableWidth / tableCols;
    const rowHeight = config.table.rowHeight || 8;
    const tableHeight = tableData.length * rowHeight;

    if (currentY + tableHeight > pageHeight - margin) {
      doc.addPage();
      drawPageBorder();
      currentY = margin + config.spacing.topPageMargin + (config.spacing.beforeTable || 0);
    }

    doc.setFont(config.font.family, "normal");
    doc.setFontSize(config.font.size.table);
    
    const tableStartX = margin + (contentWidth - tableWidth) / 2;
    
    tableData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = tableStartX + (colIndex * colWidth);
        const y = currentY + (rowIndex * rowHeight);
        
        doc.rect(x, y, colWidth, rowHeight);
        
        const cellText = cell || "";
        const textWidth = doc.getTextWidth(cellText);
        const textX = x + (colWidth - textWidth) / 2;
        const textY = y + (rowHeight / 2) + 2;
        
        doc.text(cellText, textX, textY);
      });
    });

    return currentY + tableHeight;
  };
};