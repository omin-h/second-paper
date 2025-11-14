import { printMixedText } from './mathTextRenderer.js';

export const createImageRenderer = (doc, pageHeight, margin, drawPageBorder, config) => {
  return async (imageData, imageHeight, currentY, imageAlign = 'center', imageIndex = 0, totalImages = 1) => {
    currentY += config.spacing.beforeImage || 0;

    // Only add page break for individual images (right-aligned or single center images)
    // For inline images (multiple center images), page break is handled by the question renderer
    if (imageAlign !== 'inline' && currentY + imageHeight > pageHeight - margin) {
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
        } else if (imageAlign === 'inline') {
          // Inline rendering - place images side by side with FIXED HEIGHT, centered as a group
          const contentWidth = pageWidth - 2 * margin;
          const gap = 2; // Gap between images in mm
          
          // Use FIXED height, calculate width based on aspect ratio
          let calculatedHeight = imageHeight; // Start with fixed height
          let imageWidth = calculatedHeight * aspectRatio;
          
          // Calculate total width of all images plus gaps
          const totalGap = (totalImages - 1) * gap;
          let totalWidth = (imageWidth * totalImages) + totalGap;
          
          // If total width exceeds content width, scale down proportionally
          if (totalWidth > contentWidth) {
            const availableWidth = contentWidth - totalGap;
            imageWidth = availableWidth / totalImages;
            calculatedHeight = imageWidth / aspectRatio; // Recalculate height to maintain aspect ratio
          }
          
          actualImageHeight = calculatedHeight;
          totalWidth = (imageWidth * totalImages) + totalGap;
          
          // Center the entire group of images
          const groupStartX = (pageWidth - totalWidth) / 2;
          
          // Calculate x position for this specific image
          const xPos = groupStartX + (imageIndex * (imageWidth + gap));
          
          doc.addImage(imageData, 'JPEG', xPos, currentY, imageWidth, actualImageHeight);
          finalY = currentY + actualImageHeight;
        } else {
          // Center-aligned (default) with FIXED HEIGHT
          actualImageHeight = imageHeight; // Use the passed fixed height
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

  const parseHtmlTable = (htmlTable) => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlTable;
    
    const table = tempDiv.querySelector('table');
    if (!table) {
      console.error('No table found in HTML');
      return { tableData: [], tableCols: 0 };
    }

    const rows = table.querySelectorAll('tr');
    const tableData = [];
    let maxCols = 0;

    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      const rowData = [];
      
      cells.forEach(cell => {
        // Extract text content, preserving basic formatting
        let cellText = cell.innerHTML
          .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
          .replace(/<[^>]*>/g, '') // Remove other HTML tags
          .trim();
        
        // Decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = cellText;
        cellText = textarea.value;
        
        rowData.push(cellText);
      });
      
      if (rowData.length > 0) {
        tableData.push(rowData);
        maxCols = Math.max(maxCols, rowData.length);
      }
    });

    // Ensure all rows have the same number of columns
    tableData.forEach(row => {
      while (row.length < maxCols) {
        row.push('');
      }
    });

    return { tableData, tableCols: maxCols };
  };

  return (inputData, inputCols, currentY) => {
    currentY += config.spacing.beforeTable || 0;

    let tableData, tableCols;

    // Check if input is HTML string or array data
    if (typeof inputData === 'string' && inputData.includes('<table')) {
      // Parse HTML table
      const parsed = parseHtmlTable(inputData);
      tableData = parsed.tableData;
      tableCols = parsed.tableCols;
      
      console.log('Parsed HTML table data:', tableData);
      console.log('Table columns:', tableCols);
    } else {
      // Use existing array format (backward compatibility)
      tableData = inputData;
      tableCols = inputCols;
      
      console.log('Using array table data:', tableData);
      console.log('Table columns:', tableCols);
    }

    if (!tableData || tableData.length === 0) {
      console.warn('No table data to render');
      return currentY;
    }

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
        
        // Draw cell border with reduced thickness
        doc.setLineWidth(0.1); // Reduced from default (~0.2) to 0.1mm
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