const fs = require("fs");
const fetch = require("node-fetch");

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

(async () => {
  const rows = await Promise.all(
    members.map(async ({ username, role }) => {
      const data = await fetchGitHubUser(username);
      if (!data) return "";

      return `
  <tr>
    <td><img src="${data.avatar_url}" width="60" height="60" style="border-radius: 50%;" /></td>
    <td>
      <a href="${data.html_url}">@${data.login}</a><br/>
      ${role && `<strong>${role}</strong><br/>`}
      <small>${data.name || ""}</small><br/>
      <small>${data.bio || ""}</small>
    </td>
  </tr>`;
    })
  );

  const markdown = `<h1>Kandy For Scale</h1>

<h2>👥 Meet the Team</h2>

<table>
  <tr>
    <th>Avatar</th>
    <th>Info</th>
  </tr>
  ${rows.join("\n")}
</table>
`;

  fs.writeFileSync("profile/README.md", markdown);
  console.log("✅ README.md updated.");
})();
