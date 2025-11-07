export class SecondPaperHeader {
  constructor(doc, pageWidth, pageHeight, margin) {
    this.doc = doc;
    this.pageWidth = pageWidth;
    this.pageHeight = pageHeight;
    this.margin = margin;
  }

  async renderHeader(examDetails = {}) {
    let currentY = this.margin;

    currentY = this.renderCopyrightInfo(currentY, examDetails);
    currentY = await this.renderWatermark(currentY, examDetails);
    currentY = this.renderTitle(currentY, examDetails);
    currentY = this.renderSubtitle(currentY, examDetails);
    currentY = this.renderDivider(currentY);
    currentY = this.renderSubjectInfo(currentY, examDetails);
    currentY = this.renderStudentIdBoxes(currentY);
    currentY = this.renderDivider(currentY);
    currentY = this.renderInstructions(currentY, examDetails);

    return currentY;
  }

  // Render copyright and teacher ID
  renderCopyrightInfo(startY, examDetails) {
    this.doc.setFontSize(8);
    this.doc.setFont("times", "normal");

    this.doc.text("All Rights Reserved", this.margin + 4, startY-4);

    this.doc.text(
      `Teacher ID ${examDetails.teacherId || "TCH-XXXX"}`,
      this.pageWidth - this.margin - 32,
      startY-4
    );

    return startY + 5;
  }

  // Render watermark image
  async renderWatermark(startY, examDetails) {
    try {
      // Load watermark image from the same folder
      const response = await fetch('/src/utils/pdf/header/watermark.png');
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            this.doc.addImage(
              reader.result,
              'PNG',
              this.margin,
              startY,
              this.pageWidth - this.margin * 2,
              15
            );
            resolve(startY + 20);
          } catch (error) {
            console.error("Error adding watermark:", error);
            resolve(startY + 5);
          }
        };
        reader.onerror = () => {
          console.error("Error reading watermark file");
          resolve(startY);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading watermark:", error);
      return startY;
    }
  }

  // Render exam title
  renderTitle(startY, examDetails) {
    this.doc.setFontSize(16);
    this.doc.setFont("times", "bold");

    const title = examDetails.title || "II Exam Paper";
    const cleanTitle = this.cleanText(title);

    const titleLines = this.doc.splitTextToSize(
      cleanTitle,
      this.pageWidth - this.margin * 2
    );

    titleLines.forEach(line => {
      this.doc.text(line, this.pageWidth / 2, startY - 2, { align: "center" });
      startY += 7;
    });

    return startY - 2;
  }

  // Render subtitle
  renderSubtitle(startY, examDetails) {
    const subtitle = examDetails.subtitle || "";
    if (!subtitle) return startY;

    const cleanSubtitle = this.cleanText(subtitle);
    this.doc.setFontSize(12);
    this.doc.setFont("times", "normal");
    this.doc.text(cleanSubtitle, this.pageWidth / 2, startY, { align: "center" });

    return startY + 6;
  }

  // Render horizontal divider line
  renderDivider(startY) {
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      startY,
      this.pageWidth - this.margin,
      startY
    );
    return startY + 5;
  }

  // Render subject, grade, and duration
  renderSubjectInfo(startY, examDetails) {
    this.doc.setFontSize(12);
    this.doc.setFont("times", "bold");

    const subject = examDetails.subject || "SUBJECT";
    const grade = examDetails.grade || "";
    const duration = examDetails.duration || "Duration: 2 Hours";

    this.doc.text(subject, this.margin + 4, startY);

    if (grade) {
      this.doc.text(
        grade,
        this.pageWidth - this.margin - 5,
        startY,
        { align: "right" }
      );
    }

    this.doc.setFontSize(10);
    this.doc.setFont("times", "normal");
    this.doc.text(
      duration,
      this.pageWidth - this.margin - 5,
      startY + 6,
      { align: "right" }
    );

    return startY + 10;
  }

  // Render student ID input boxes
  renderStudentIdBoxes(startY) {
    this.doc.setFontSize(12);
    this.doc.setFont("times", "bold");

    const numBoxes = 10;
    const boxSize = 10;
    const boxSpacing = 12;
    const totalBoxesWidth = numBoxes * boxSpacing;
    const startX = (this.pageWidth - totalBoxesWidth) / 2;

    this.doc.text("STD -", startX - 33, startY + 2);

    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);

    let boxX = startX - 15;
    for (let i = 0; i < numBoxes; i++) {
      this.doc.roundedRect(
        boxX,
        startY - boxSize / 2,
        boxSize,
        boxSize,
        2.5,
        2.5
      );
      boxX += boxSpacing;
    }

    return startY + boxSize;
  }

  // Render instructions section
  renderInstructions(startY, examDetails) {
    const instructions = examDetails.instructions || "";
    if (!instructions.trim()) return startY;

    // Instructions header
    this.doc.setFontSize(11);
    this.doc.setFont("times", "bold");
    this.doc.text("Instructions:", this.margin + 5, startY);
    startY += 6;

    // Instructions content
    this.doc.setFontSize(10);
    this.doc.setFont("times", "normal");

    const cleanInstructions = this.cleanText(instructions);
    const instructionLeftIndent = 4;
    const instrMaxWidth = this.pageWidth - this.margin * 2 - 10 - instructionLeftIndent;
    const instrStartX = this.margin + 5 + instructionLeftIndent;

    const instructionLines = this.doc.splitTextToSize(cleanInstructions, instrMaxWidth);
    
    instructionLines.forEach(line => {
      this.doc.text(line, instrStartX, startY);
      startY += 5;
    });

    startY += 3;

    // Divider after instructions
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      startY,
      this.pageWidth - this.margin,
      startY
    );
    startY += 5;

    return startY;
  }

  // Clean HTML text
  cleanText(html) {
    if (!html) return "";
    return html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}