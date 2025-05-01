const fs = require("fs");
const members = require("../members.json");
const token = process.env.GITHUB_TOKEN;

async function fetchGitHubUser(username) {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: { Authorization: `token ${token}` },
  });
  if (!res.ok) {
    console.error(`Failed to fetch ${username}:`, await res.text());
    return null;
  }
  return res.json();
}

const ROLE_ORDER = { senior: 1, mid: 2, junior: 3 };
function getRoleIcon(role) {
  const map = { senior: "⭐", mid: "🚀", junior: "🌱" };
  return map[role] || "";
}

(async () => {
  const sortedMembers = members.sort((a, b) => {
    return (ROLE_ORDER[a.role] || 99) - (ROLE_ORDER[b.role] || 99);
  });

  const columns = await Promise.all(
    sortedMembers.map(async ({ username, role }) => {
      const data = await fetchGitHubUser(username);
      if (!data) return "";

      return `
  <td align="center">
    <a href="${data.html_url}"><strong>@${data.login}</strong></a><br/>
    <a href="${data.html_url}">
      <img src="${data.avatar_url}" width="80" height="80" style="border-radius: 50%;" alt="@${data.login}"/>
    </a><br/>
    ${getRoleIcon(role)}
  </td>`;
    })
  );

  // Arrange all in single row with multiple columns
  const table = `
<h2 align="center">👥 Meet the Team</h2>

<table align="center">
  <tr>
    ${columns.join("\n")}
  </tr>
</table>`;

  // Read general info from info.md
  const generalInfo = fs.readFileSync("profile/info.md", "utf8");

  // Combine general info + team board
  const finalMarkdown = `${generalInfo.trim()}\n\n${table.trim()}\n`;

  fs.writeFileSync("profile/README.md", finalMarkdown);
  console.log("✅ README.md updated.");
})();
