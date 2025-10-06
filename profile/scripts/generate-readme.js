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

function formatContributions(contributions) {
  if (!contributions || !Array.isArray(contributions) || contributions.length === 0) return "• Always contributing to team success";
  return contributions.map(contrib => `• ${contrib}`).join("<br/>");
}

function formatTechstack(techstack) {
  if (!techstack || !Array.isArray(techstack) || techstack.length === 0) return "";
  return techstack.map(tech => `\`${tech}\``).join(" ");
}

(async () => {
  const sortedMembers = members.sort((a, b) => {
    return (ROLE_ORDER[a.role] || 99) - (ROLE_ORDER[b.role] || 99);
  });

  // Fetch all member data once
  const memberData = await Promise.all(
    sortedMembers.map(async (member) => {
      const { username } = member;
      const data = await fetchGitHubUser(username);
      return { member, data };
    })
  );

  // Filter out members with failed fetches
  const validMembers = memberData.filter(({ data }) => data !== null);

  // Detailed layout with collapsible information
  const detailedColumns = validMembers.map(({ member, data }) => {
    const { role } = member;
    return `
<td align="center">
  <a href="${data.html_url}"><strong>@${data.login}</strong></a><br/>
  <a href="${data.html_url}">
    <img src="${data.avatar_url}" width="80" height="80" style="border-radius: 50%;" alt="@${data.login}"/>
  </a><br/>
  ${getRoleIcon(role)}<br/>
  <small><em>${member.description || 'Passionate team member'}</em></small><br/>
  <details>
    <summary><small>View Details</small></summary>
    <small>
      <strong>Key Contributions:</strong><br/>
      ${formatContributions(member.biggest_contributions)}<br/><br/>
      <strong>Techstack:</strong><br/>
      ${formatTechstack(member.techstack)}<br/><br/>
      <em>${member.fun_fact || 'Always learning something new'}</em>
    </small>
  </details>
</td>`;
  });

  // Create detailed table section
  const detailedTable = `
<h2 align="center">👥 Meet the Team</h2>

<table align="center">
  <tr>
    ${detailedColumns.join("\n")}
  </tr>
</table>`;

  // Read general info from info.md
  const generalInfo = fs.readFileSync("profile/info.md", "utf8");

  // Combine general info + team section
  const finalMarkdown = `${generalInfo.trim()}\n\n${detailedTable.trim()}\n`;

  fs.writeFileSync("profile/README.md", finalMarkdown);
  console.log("✅ README.md updated.");
})();
