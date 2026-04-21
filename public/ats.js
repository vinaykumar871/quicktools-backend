console.log("ATS JS LOADED");

// =========================
// 📄 READ PDF + EXTRACT TEXT
// =========================
async function checkATS() {

  console.log("checkATS started");

  const file = document.getElementById("resumeFile").files[0];

  if (!file) {
    document.getElementById("errorMsg").innerText = "⚠ Upload resume first!";
    return;
  }

  document.getElementById("errorMsg").innerText = "";

  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";

  const reader = new FileReader();

  reader.onload = async function () {
    try {

      console.log("PDF loaded");

      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const strings = content.items.map(item => item.str);
        text += strings.join(" ");
      }

      const jobDesc = document.getElementById("jobDesc").value;

      await getAIScore(text, jobDesc);

    } catch (err) {
      console.error(err);
      if (loader) loader.style.display = "none";
    }
  };

  reader.readAsArrayBuffer(file);
}


// =========================
// 🤖 AI CALL + UI
// =========================
async function getAIScore(text, jobDesc) {
  try {

    console.log("getAIScore called");

    const res = await fetch("http://127.0.0.1:5000/ats-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        resumeText: text,
        jobDesc: jobDesc
      })
    });

    const data = await res.json();

    console.log("API RESPONSE:", data);

    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";

    if (data && data.result) {

      let cleanText = data.result.replace(/\*\*/g, "");

      // =========================
      // 🎯 EXTRACT SCORE
      // =========================
      const scoreMatch = cleanText.match(/ATS Score:\s*(\d+)/);
      let score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

      const scoreText = document.getElementById("scoreText");
      const bar = document.getElementById("scoreBar");
      const statusText = document.getElementById("statusText");

      document.getElementById("resultBox").style.display = "block";

      // =========================
      // 🔢 ANIMATION NUMBER
      // =========================
      let current = 0;
      const interval = setInterval(() => {
        if (current >= score) {
          clearInterval(interval);
        } else {
          current++;
          scoreText.innerText = current + "/100";
        }
      }, 15);

      // =========================
      // 📊 BAR ANIMATION
      // =========================
      setTimeout(() => {
        bar.style.width = score + "%";
      }, 200);

      // =========================
      // 🎨 COLOR + STATUS
      // =========================
      let status = "";

      if (score < 50) {
        bar.style.background = "#ef4444";
        status = "⚠ Poor Resume";
      } else if (score < 75) {
        bar.style.background = "#f59e0b";
        status = "⚡ Moderate Resume";
      } else {
        bar.style.background = "#22c55e";
        status = "✅ Strong Resume";
      }

      statusText.innerText = status;

      // =========================
      // 📋 SPLIT CONTENT
      // =========================
      const missingPart = cleanText.split("Missing Keywords")[1] || "";
      const improvePart = cleanText.split("Improvements")[1] || "";

      document.getElementById("missing").innerText = missingPart.trim();
      document.getElementById("improve").innerText = improvePart.trim();

      if (typeof showToast === "function") {
        showToast("✅ ATS Analysis Completed!");
      }

    } else {
      document.getElementById("errorMsg").innerText = "⚠ AI response failed.";
    }

  } catch (error) {
    console.error(error);

    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";

    document.getElementById("errorMsg").innerText =
      "⚠ Server not running!";
  }
}
// =========================
// 📥 DOWNLOAD FUNCTION
// =========================
function downloadPDF(text) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("ATS Resume Analysis Report", 20, 20);

  doc.setFontSize(12);

  const lines = doc.splitTextToSize(text, 170);

  doc.text(lines, 20, 40);

  doc.save("ATS_Report.pdf");
}


// =========================
// ⬇ DOWNLOAD REPORT BUTTON
// =========================
function downloadReport() {

  const score = document.getElementById("score").innerText;

  const suggestions =
    document.getElementById("aiSuggestions")?.innerText ||
    document.getElementById("suggestions")?.innerText;

  const text = `
ATS Resume Analysis Report

${score}

----------------------------

AI Suggestions:
${suggestions}
`;

  downloadPDF(text);
}