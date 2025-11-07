import { printMixedText } from './mathTextRenderer.js';

export const createImageRenderer = (doc, pageHeight, margin, drawPageBorder, config) => {
  return async (imageData, imageHeight, currentY, imageAlign = 'center') => {
    currentY += config.spacing.beforeImage || 0;

    if (currentY + imageHeight > pageHeight - margin) {
      doc.addPage();
      drawPageBorder();
      currentY = margin + config.spacing.topPageMargin + (config.spacing.beforeImage || 0);
    }

    const img = new Image();
    img.src = imageData;
    
    let finalY = currentY;
    let actualImageHeight = imageHeight;
    
    await new Promise((resolve) => {
      img.onload = () => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const aspectRatio = img.width / img.height;
        
        if (imageAlign === 'right') {
          const contentWidth = pageWidth - 2 * margin;
          const imageWidth = contentWidth * 0.3;
          actualImageHeight = imageWidth / aspectRatio;
          const xPos = pageWidth - margin - imageWidth;
          
          // Draw the image on the right
          doc.addImage(imageData, 'JPEG', xPos, currentY, imageWidth, actualImageHeight);
          finalY = currentY + actualImageHeight;
        } else {
          // Center-aligned (default)
          const imageWidth = imageHeight * aspectRatio;
          const xPos = (pageWidth - imageWidth) / 2;
          
          doc.addImage(imageData, 'JPEG', xPos, currentY, imageWidth, imageHeight);
          finalY = currentY + imageHeight;
        }
        resolve();
      };
      img.onerror = () => resolve();
    });

    return { finalY, actualImageHeight };
  };
};


export const createTableRenderer = (doc, pageHeight, margin, contentWidth, drawPageBorder, config) => {
  const wrapText = (text, maxWidth) => {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  };

  return (tableData, tableCols, currentY) => {
    currentY += config.spacing.beforeTable || 0;

    const tableWidth = contentWidth * (config.table.widthPercentage || 0.7);
    const colWidth = tableWidth / tableCols;
    const baseRowHeight = config.table.rowHeight || 8;
    const cellPadding = 2;
    const maxCellWidth = colWidth - (cellPadding * 2);
    const lineHeight = 4;

    doc.setFont(config.font.family, "normal");
    doc.setFontSize(config.font.size.table);

    // Calculate row heights based on wrapped text
    const rowHeights = tableData.map(row => {
      let maxLines = 1;
      row.forEach(cell => {
        const cellText = cell || "";
        const lines = wrapText(cellText, maxCellWidth);
        maxLines = Math.max(maxLines, lines.length);
      });
      return Math.max(baseRowHeight, maxLines * lineHeight + cellPadding * 2);
    });

    const totalTableHeight = rowHeights.reduce((sum, height) => sum + height, 0);

    if (currentY + totalTableHeight > pageHeight - margin) {
      doc.addPage();
      drawPageBorder();
      currentY = margin + config.spacing.topPageMargin + (config.spacing.beforeTable || 0);
    }

    const tableStartX = margin + (contentWidth - tableWidth) / 2;
    let rowY = currentY;

    tableData.forEach((row, rowIndex) => {
      const rowHeight = rowHeights[rowIndex];

      row.forEach((cell, colIndex) => {
        const x = tableStartX + (colIndex * colWidth);
        
        // Draw cell border
        doc.rect(x, rowY, colWidth, rowHeight);
        
        // Wrap and draw text
        const cellText = cell || "";
        const lines = wrapText(cellText, maxCellWidth);
        
        const textStartY = rowY + cellPadding + lineHeight;
        
        lines.forEach((line, lineIndex) => {
          const textWidth = doc.getTextWidth(line);
          const textX = x + cellPadding + (maxCellWidth - textWidth) / 2;
          const textY = textStartY + (lineIndex * lineHeight);
          
          // Use printMixedText for math symbol support
          printMixedText(doc, line, textX, textY);
        });
      });

      rowY += rowHeight;
    });

    return rowY;
  };
};