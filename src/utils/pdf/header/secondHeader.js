export class PdfHeader {
    constructor(generator, watermarkImage) {
        this.generator = generator;
        this.pdf = generator.pdf;
        this.watermark = watermarkImage;
    }
    renderHeader(examDetails = {}) {
        const pdf = this.pdf;
        const gen = this.generator;
        let startY = gen.currentY - 1;

        startY = this.renderCopyrightInfo(startY, examDetails);
        startY = this.renderWatermark(startY);
        startY = this.renderTitle(startY, examDetails);
        startY = this.renderSubtitle(startY, examDetails);
        startY = this.renderDivider(startY);
        startY = this.renderSubjectInfo(startY, examDetails);
        startY = this.renderStudentIdBoxes(startY);
        startY = this.renderDivider(startY);
        startY = this.renderInstructions(startY, examDetails);

        gen.currentY = startY; 
    }


    //Render copyright and teacher ID
    renderCopyrightInfo(startY, examDetails) {
        const gen = this.generator;
        gen.setFont("allRightText");

        this.pdf.text(
            "All Rights Reserved",
            gen.margins.left + 4,
            startY
        );

        this.pdf.text(
            `Teacher ID ${examDetails.teacherId || "TCH-XXXX"}`,
            gen.pageWidth - gen.margins.right - 50,
            startY
        );

        return startY + 1;
    }



    //Render watermark image
    renderWatermark(startY) {
        const gen = this.generator;
        this.pdf.addImage(
            this.watermark,
            "PNG",
            gen.margins.left,
            startY,
            gen.pageWidth - gen.margins.left - gen.margins.right,
            8
        );
        return startY + 18;
    }



    //Render exam title
    renderTitle(startY, examDetails) {
        const gen = this.generator;
        gen.setFont("mainTitle");

        const rawTitle = examDetails.title || "Exam Paper";
        const cleanTitle = this.cleanText(rawTitle);

        const titleLines = this.pdf.splitTextToSize(
            cleanTitle,
            gen.pageWidth - gen.margins.left - gen.margins.right - 10
        );

        titleLines.forEach(line => {
            this.pdf.text(line, gen.pageWidth / 2, startY, { align: "center" });
            startY += 7;
        });

        return startY;
    }

    renderSubtitle(startY, examDetails) {
        const gen = this.generator;
        const rawSubtitle = examDetails.subtitle || "";

        if (!rawSubtitle) return startY;

        const cleanSubtitle = this.cleanText(rawSubtitle);
        gen.setFont("subtitleNormal");
        this.pdf.text(cleanSubtitle, gen.pageWidth / 2, startY, { align: "center" });

        return startY + 6;
    }


    //Render horizontal divider line
    renderDivider(startY) {
        const gen = this.generator;
        this.pdf.setDrawColor(0, 0, 0);
        this.pdf.line(
            gen.margins.left,
            startY,
            gen.pageWidth - gen.margins.right,
            startY
        );
        return startY + 5;
    }


    //Render subject, grade, and duration
    renderSubjectInfo(startY, examDetails) {
        const gen = this.generator;
        gen.setFont("subtitleSuj");

        const subject = examDetails.subject || "SUBJECT";
        const grade = examDetails.grade || "";
        const duration = examDetails.duration || "Duration: 2 Hours";

        this.pdf.text(subject, gen.margins.left + 4, startY);

        if (grade) {
            this.pdf.text(
                grade,
                gen.pageWidth - gen.margins.right - 5,
                startY,
                { align: "right" }
            );
        }

        this.pdf.text(
            duration,
            gen.pageWidth - gen.margins.right - 5,
            startY + 8,
            { align: "right" }
        );

        return startY + 10;
    }

    //Render student ID input boxes
    renderStudentIdBoxes(startY) {
        const gen = this.generator;
        gen.setFont("title");

        const numBoxes = 10;
        const boxSize = 10;
        const boxSpacing = 12;
        const totalBoxesWidth = numBoxes * boxSpacing;
        const startX = (gen.pageWidth - totalBoxesWidth) / 2;

        this.pdf.text("STD -", startX - 33, startY + 2);

        let boxX = startX - 15;
        for (let i = 0; i < numBoxes; i++) {
            this.pdf.roundedRect(
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

    //Render instructions section
    renderInstructions(startY, examDetails) {
        const gen = this.generator;
        const instructionHtml = examDetails.instructions || "";

        if (!instructionHtml.trim()) return startY;

        // Instructions header
        gen.setFont("subtitle");
        this.pdf.text(
            "Instructions:",
            gen.margins.left + 5,
            startY
        );
        startY += 5;

        // Calculate instruction area
        const instructionLeftIndent = 4;
        const instrMaxWidth = gen.pageWidth - gen.margins.left - gen.margins.right - 10 - instructionLeftIndent;
        const instrStartX = gen.margins.left + 5 + instructionLeftIndent;

        // Render HTML instructions using the HTML parser
        const instrHeight = gen.htmlParser.renderHTMLInstructions(
            instructionHtml,
            instrStartX,
            instrMaxWidth,
            startY
        );

        startY += instrHeight;

        // Divider after instructions
        this.pdf.line(
            gen.margins.left,
            startY,
            gen.pageWidth - gen.margins.right,
            startY
        );
        startY += 5;

        return startY;
    }

    //Clean HTML text
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

export default PdfHeader;