const searchBtn = document.getElementById("searchBtn");
const input = document.getElementById("searchInput");

const profile = document.getElementById("profile");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const reposContainer = document.getElementById("repos");

// Battle elements
const battleBtn = document.getElementById("battleBtn");
const user1Input = document.getElementById("user1");
const user2Input = document.getElementById("user2");
const battleResult = document.getElementById("battleResult");

/* ================= VALIDATION ================= */

function isValidUsername(username) {
  const regex = /^[a-zA-Z][a-zA-Z0-9-]{0,38}$/;
  return regex.test(username);
}

/* ================= SEARCH ================= */

searchBtn.addEventListener("click", () => {
  const username = input.value.trim();

  if (!username) return;

  // ❌ Invalid format
  if (!isValidUsername(username)) {
    error.textContent = "Invalid Username ❌";
    error.classList.remove("hidden");
    profile.classList.add("hidden");
    reposContainer.classList.add("hidden");
    return;
  }

  getUser(username);
});

async function getUser(username) {
  try {
    loading.classList.remove("hidden");
    error.classList.add("hidden");
    profile.classList.add("hidden");
    reposContainer.classList.add("hidden");

    const res = await fetch(`https://api.github.com/users/${username}`);
    const data = await res.json();

    // 🔥 MAIN FIX
    if (res.status === 404 || data.message === "Not Found") {
      throw new Error("User Not Found");
    }

    showProfile(data);
    getRepos(data.repos_url);

  } catch (err) {
    error.textContent = "User Not Found ❌";
    error.classList.remove("hidden");
  } finally {
    loading.classList.add("hidden");
  }
}

function showProfile(user) {
  profile.classList.remove("hidden");

  profile.innerHTML = `
    <img src="${user.avatar_url}">
    <div>
      <h2>${user.name || user.login}</h2>
      <p>${user.bio || "No bio"}</p>
      <p>Joined: ${new Date(user.created_at).toDateString()}</p>
      <a href="${user.html_url}" target="_blank">Visit Profile</a>
    </div>
  `;
}

/* ================= REPOS ================= */

async function getRepos(url) {
  const res = await fetch(url);
  const repos = await res.json();

  const latest = repos
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  showRepos(latest);
}

function showRepos(repos) {
  reposContainer.classList.remove("hidden");
  reposContainer.innerHTML = "<h3>📦 Latest Repositories</h3>";

  const grid = document.createElement("div");
  grid.classList.add("repos-grid");

  repos.forEach(repo => {
    const repoDiv = document.createElement("div");
    repoDiv.classList.add("repo");

    const date = new Date(repo.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    repoDiv.innerHTML = `
      <a href="${repo.html_url}" target="_blank">${repo.name}</a>
      <p>${date}</p>
      <p>⭐ ${repo.stargazers_count}</p>
    `;

    grid.appendChild(repoDiv);
  });

  reposContainer.appendChild(grid);
}

/* ================= BATTLE ================= */

battleBtn.addEventListener("click", () => {
  const u1 = user1Input.value.trim();
  const u2 = user2Input.value.trim();

  if (!u1 || !u2) return;

  if (!isValidUsername(u1) || !isValidUsername(u2)) {
    battleResult.innerHTML = "Invalid Username ❌";
    return;
  }

  startBattle(u1, u2);
});

async function startBattle(u1, u2) {
  try {
    battleResult.innerHTML = "Loading... ⚡";

    const [res1, res2] = await Promise.all([
      fetch(`https://api.github.com/users/${u1}`),
      fetch(`https://api.github.com/users/${u2}`)
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    // 🔥 MAIN FIX
    if (
      res1.status === 404 || res2.status === 404 ||
      data1.message === "Not Found" || data2.message === "Not Found"
    ) {
      throw new Error("User Not Found");
    }

    const stars1 = await getStars(data1.repos_url);
    const stars2 = await getStars(data2.repos_url);

    showBattle(data1, data2, stars1, stars2);

  } catch (err) {
    battleResult.innerHTML = "User Not Found ❌";
  }
}

async function getStars(url) {
  const res = await fetch(url);
  const repos = await res.json();

  return repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
}

function showBattle(u1, u2, s1, s2) {
  let w1 = "", w2 = "";

  if (s1 > s2) {
    w1 = "winner";
    w2 = "loser";
  } else if (s2 > s1) {
    w2 = "winner";
    w1 = "loser";
  }

  battleResult.innerHTML = `
    <div class="battle-card ${w1}">
      <img src="${u1.avatar_url}" width="80">
      <h3>${u1.name || u1.login}</h3>

      <p>⭐ ${s1}</p>
      <p>👥 ${u1.followers}</p>
      <p>📦 ${u1.public_repos}</p>

      <a href="${u1.html_url}" target="_blank">🔗 Profile</a>
      <a href="${u1.html_url}?tab=repositories" target="_blank">📂 Repos</a>
    </div>

    <div class="battle-card ${w2}">
      <img src="${u2.avatar_url}" width="80">
      <h3>${u2.name || u2.login}</h3>

      <p>⭐ ${s2}</p>
      <p>👥 ${u2.followers}</p>
      <p>📦 ${u2.public_repos}</p>

      <a href="${u2.html_url}" target="_blank">🔗 Profile</a>
      <a href="${u2.html_url}?tab=repositories" target="_blank">📂 Repos</a>
    </div>
  `;
}