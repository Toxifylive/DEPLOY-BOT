const express = require("express");
const bodyParser = require("body-parser");
const { Octokit } = require("@octokit/rest");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/deploy", async (req, res) => {
  try {
    const { repoName, htmlCode, githubToken } = req.body;

    if (!repoName || !htmlCode || !githubToken) {
      return res.status(400).json({ error: "repoName, htmlCode, and githubToken are required" });
    }

    const octokit = new Octokit({ auth: githubToken });

    // 1. Create repo
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: false,
    });

    // 2. Convert html to base64
    const base64 = Buffer.from(htmlCode).toString("base64");

    // 3. Upload index.html
    await octokit.repos.createOrUpdateFileContents({
      owner: (await octokit.users.getAuthenticated()).data.login,
      repo: repoName,
      path: "index.html",
      message: "Add index.html",
      content: base64,
      branch: "main",
    });

    // 4. Enable GitHub Pages
    await octokit.repos.enablePagesSite({
      owner: (await octokit.users.getAuthenticated()).data.login,
      repo: repoName,
      source: { branch: "main", path: "/" },
    });

    // 5. Send back URL
    const username = (await octokit.users.getAuthenticated()).data.login;
    const siteURL = `https://${username}.github.io/${repoName}/`;
    res.json({ url: siteURL });

  } catch (error) {
    console.error("Deploy error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
