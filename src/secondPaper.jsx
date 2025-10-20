import { useState } from "react";

export default function SecondPaper() {
  const [text, setText] = useState("");

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Second Paper</h1>
      
      <div style={{ marginTop: "30px" }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something here..."
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            border: "2px solid #ccc",
            borderRadius: "4px",
            outline: "none"
          }}
        />
      </div>

      <div style={{ marginTop: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "4px" }}>
        <h3>You typed:</h3>
        <p style={{ fontSize: "18px" }}>{text || "Nothing yet..."}</p>
      </div>
    </div>
  );
}