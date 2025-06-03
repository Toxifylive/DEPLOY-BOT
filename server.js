const express = require("express");
const bodyParser = require("body-parser");
const { Octokit } = require("@octokit/rest");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Your GitHub Details
const GITHUB_USERNAME = "Toxifylive";
const GITHUB_TOKEN = "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"; // ⚠️ For private testing only

// Initialize Octokit
const octokit = new Octokit({ auth: GITHUB_TOKEN });

app.post("/deploy", async (req, res) => {
  try {
    const { repoName, htmlCode } = req.body;

    if (!repoName || !htmlCode) {
      return res.status(400).json({ error: "repoName and htmlCode are required" });
    }

    // 1. Create GitHub repo
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: false,
    });

    // 2. Convert HTML to base64
    const base64 = Buffer.from(htmlCode).toString("base64");

    // 3. Upload index.html to repo
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_USERNAME,
      repo: repoName,
      path: "index.html",
      message: "Add index.html",
      content: base64,
      branch: "main",
    });

    // 4. Enable GitHub Pages
    await octokit.repos.enablePagesSite({
      owner: GITHUB_USERNAME,
      repo: repoName,
      source: { branch: "main", path: "/" },
    });

    // 5. Send success response with URL
    const siteURL = `https://${GITHUB_USERNAME}.github.io/${repoName}/`;
    res.json({ url: siteURL });

  } catch (error) {
    console.error("Error deploying:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
