const { execSync } = require('child_process');
const fs = require('fs');

async function generateSummary() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined");
    process.exit(1);
  }

  let commits = "";
  try {
    const tags = execSync('git tag --sort=-creatordate').toString().trim().split('\n').filter(Boolean);
    if (tags.length > 1) {
      const currentTag = tags[0];
      const previousTag = tags[1];
      console.log(`Comparing tags: ${previousTag} -> ${currentTag}`);
      commits = execSync(`git log ${previousTag}..${currentTag} --oneline`).toString().trim();
    } else {
      console.log("Only one tag found, getting last 10 commits");
      commits = execSync('git log -n 10 --oneline').toString().trim();
    }
  } catch (err) {
    console.error("Failed to get commit logs, using git log -n 10", err);
    try {
      commits = execSync('git log -n 10 --oneline').toString().trim();
    } catch (e) {
      commits = "Initial release commits.";
    }
  }

  if (!commits) {
    commits = "No new commits found.";
  }

  console.log("Commits list:\n", commits);

  const prompt = `На основе следующего списка коммитов составь короткое, дружелюбное и профессиональное саммари изменений (Changelog) на русском языке для закрытого сообщества мессенджера. 
Используй маркированный список. Пиши только сам список изменений, без вводных слов и без приветствий.
Список коммитов:
${commits}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini API error");
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!summary) {
      throw new Error("Empty response from Gemini");
    }

    console.log("Generated Summary:\n", summary);
    fs.writeFileSync('changelog-summary.txt', summary);
  } catch (error) {
    console.error("Error generating summary:", error);
    fs.writeFileSync('changelog-summary.txt', `Список изменений:\n${commits}`);
  }
}

generateSummary();
