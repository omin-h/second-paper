import { jsPDF } from "jspdf";

export default function PdfTest() {
  const generatePdf = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    try {
      // Load TTF font from public folder
      const response = await fetch("/fonts/NotoSansMath-Regular.ttf");
      const fontData = await response.arrayBuffer();
      
      // Convert to base64
      const base64Font = btoa(
        new Uint8Array(fontData).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Add math font to jsPDF
      doc.addFileToVFS("NotoSansMath.ttf", base64Font);
      doc.addFont("NotoSansMath.ttf", "NotoSansMath", "normal");
      
      doc.setFontSize(14);

      // Helper function to detect math symbols
      const isMathSymbol = (char) => {
        const mathSymbols = /[π√∫∞≤≥±→←∑∏∂∇∆∈∉∪∩⊂⊃∀∃∧∨¬∝∞≠≈≡≅∼⊕⊗∠∥⊥°′″]/;
        return mathSymbols.test(char);
      };

      // Helper function to detect superscripts
      const isSuperscript = (char) => {
        return /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ]/.test(char);
      };

      // Helper function to detect subscripts
      const isSubscript = (char) => {
        return /[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]/.test(char);
      };

      // Convert Unicode superscript to normal number
      const superscriptToNormal = (char) => {
        const map = { '⁰':'0', '¹':'1', '²':'2', '³':'3', '⁴':'4', '⁵':'5', '⁶':'6', '⁷':'7', '⁸':'8', '⁹':'9', '⁺':'+', '⁻':'-', '⁼':'=', '⁽':'(', '⁾':')', 'ⁿ':'n' };
        return map[char] || char;
      };

      // Convert Unicode subscript to normal number
      const subscriptToNormal = (char) => {
        const map = { '₀':'0', '₁':'1', '₂':'2', '₃':'3', '₄':'4', '₅':'5', '₆':'6', '₇':'7', '₈':'8', '₉':'9', '₊':'+', '₋':'-', '₌':'=', '₍':'(', '₎':')' };
        return map[char] || char;
      };

      // Function to print mixed text with auto font switching and super/subscripts
      const printMixedText = (text, x, y) => {
        let currentX = x;
        const normalSize = doc.internal.getFontSize();
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          
          if (isSuperscript(char)) {
            // Draw as superscript
            doc.setFontSize(normalSize * 0.6);
            doc.setFont("times");
            doc.text(superscriptToNormal(char), currentX, y - 2);
            currentX += doc.getTextWidth(superscriptToNormal(char));
            doc.setFontSize(normalSize);
          } else if (isSubscript(char)) {
            // Draw as subscript
            doc.setFontSize(normalSize * 0.6);
            doc.setFont("times");
            doc.text(subscriptToNormal(char), currentX, y + 1.5);
            currentX += doc.getTextWidth(subscriptToNormal(char));
            doc.setFontSize(normalSize);
          } else if (isMathSymbol(char)) {
            // Draw as math symbol
            doc.setFont("NotoSansMath");
            doc.text(char, currentX, y);
            currentX += doc.getTextWidth(char);
          } else {
            // Draw as normal text
            doc.setFont("times");
            doc.text(char, currentX, y);
            currentX += doc.getTextWidth(char);
          }
        }
        
        return currentX;
      };

      // Test examples - now with Unicode superscripts/subscripts in strings
      printMixedText("Hello math!", 10, 20);
      printMixedText("Pi: π, sqrt: √2, integral: ∫ f(x) dx, infinity: ∞", 10, 30);
      printMixedText("Inequalities: ≤ ≥, plus/minus: ±, arrows: → ←", 10, 40);
      printMixedText("Powers: x² + y³ = z⁴", 10, 50);
      printMixedText("Subscripts: H₂O, CO₂", 10, 60);
      printMixedText("Mixed: E = mc², a² + b² = c²", 10, 70);
      
    } catch (err) {
      console.error("Font loading failed:", err);
      doc.text("ERROR: Font failed to load. Check console.", 10, 20);
    }

    doc.save("math.pdf");
  };

  return <button onClick={generatePdf}>Export PDF (π test)</button>;
}