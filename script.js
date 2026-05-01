const desktop = document.querySelector(".desktop");
const startButton = document.querySelector("#startButton");
const startMenu = document.querySelector("#startMenu");
const contextMenu = document.querySelector("#contextMenu");
const timeEl = document.querySelector("#time");
const dateEl = document.querySelector("#date");
const windows = [...document.querySelectorAll(".window")];
const taskButtons = [...document.querySelectorAll(".task-icon[data-open]")];
const openButtons = [...document.querySelectorAll("[data-open]")];
const lanyardAvatar = document.querySelector("#lanyardAvatar");
const lanyardName = document.querySelector("#lanyardName");
const lanyardStatus = document.querySelector("#lanyardStatus");
const lanyardDot = document.querySelector("#lanyardDot");
const lanyardDetail = document.querySelector("#lanyardDetail");
const lanyardActivity = document.querySelector("#lanyardActivity");
const mediaArt = document.querySelector("#mediaArt");
const mediaTitle = document.querySelector("#mediaTitle");
const mediaArtist = document.querySelector("#mediaArtist");
const mediaElapsed = document.querySelector("#mediaElapsed");
const mediaDuration = document.querySelector("#mediaDuration");
const mediaProgress = document.querySelector("#mediaProgress");
const repoList = document.querySelector("#repoList");
const repoCount = document.querySelector("#repoCount");
const refreshRepos = document.querySelector("#refreshRepos");
const contribGrid = document.querySelector("#contribGrid");
const contribMonths = document.querySelector("#contribMonths");
const projectCards = [...document.querySelectorAll(".project-card")];
const projectDetailTitle = document.querySelector("#projectDetailTitle");
const projectDetailText = document.querySelector("#projectDetailText");
const activeProjectsBody = document.querySelector(".active-projects-body");
const projectBack = document.querySelector("#projectBack");

const DISCORD_USER_ID = "1177326138926837884";
const GITHUB_USER = "xtpm";
const CONTRIBUTIONS_API = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`;

let topZ = 10;
let dragState = null;
let currentSpotify = null;

function updateClock() {
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  dateEl.textContent = now.toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" });
}

function setPresenceStatus(status, label) {
  lanyardStatus.className = `presence-status ${status || "unknown"}`;
  lanyardDot.className = `status-dot ${status || "unknown"}`;
  lanyardStatus.textContent = label || status || "Unknown";
}

function formatActivity(data) {
  if (data.spotify) {
    return `Listening to ${data.spotify.song} by ${data.spotify.artist}`;
  }

  const activity = data.activities?.find((item) => item.type !== 4);
  if (!activity) return "No current activity";

  const detail = activity.details || activity.state;
  return detail ? `${activity.name}: ${detail}` : activity.name;
}

function setAvatar(user) {
  if (!user?.avatar) {
    lanyardAvatar.textContent = "?";
    return;
  }

  const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  lanyardAvatar.innerHTML = `<img src="${avatarUrl}" alt="" draggable="false" />`;
}

function formatMs(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function setMediaIdle(message = "Spotify idle") {
  currentSpotify = null;
  mediaArt?.classList.remove("has-art");
  if (mediaArt) {
    mediaArt.style.backgroundImage = "";
    mediaArt.innerHTML = `
      <div class="media-placeholder">
        <span>♪</span>
        <p>${message}</p>
      </div>
    `;
  }
  if (mediaTitle) mediaTitle.textContent = "Nothing playing";
  if (mediaArtist) mediaArtist.textContent = "Spotify via Lanyard";
  if (mediaElapsed) mediaElapsed.textContent = "0:00";
  if (mediaDuration) mediaDuration.textContent = "0:00";
  if (mediaProgress) mediaProgress.style.width = "0%";
}

function updateMediaProgress() {
  if (!currentSpotify?.timestamps?.start || !currentSpotify?.timestamps?.end) return;
  const start = currentSpotify.timestamps.start;
  const end = currentSpotify.timestamps.end;
  const now = Date.now();
  const duration = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(duration, now - start));
  const percent = (elapsed / duration) * 100;

  mediaElapsed.textContent = formatMs(elapsed);
  mediaDuration.textContent = formatMs(duration);
  mediaProgress.style.width = `${percent}%`;
}

function updateMediaPlayer(spotify) {
  if (!mediaArt) return;
  if (!spotify) {
    setMediaIdle("Nothing playing on Spotify");
    return;
  }

  currentSpotify = spotify;
  mediaArt.classList.add("has-art");
  mediaArt.innerHTML = "";
  mediaArt.style.backgroundImage = `url("${spotify.album_art_url}")`;
  mediaTitle.textContent = spotify.song || "Unknown track";
  mediaArtist.textContent = spotify.artist ? `${spotify.artist} · ${spotify.album || "Spotify"}` : spotify.album || "Spotify";
  updateMediaProgress();
}

async function updateLanyard() {
  if (!lanyardAvatar || DISCORD_USER_ID === "YOUR_DISCORD_USER_ID") {
    setPresenceStatus("unknown", "Not configured");
    lanyardDetail.textContent = "Set DISCORD_USER_ID in script.js to your Discord user ID.";
    lanyardActivity.textContent = "Join the Lanyard Discord server first so the API can see your presence.";
    return;
  }

  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    if (!response.ok) throw new Error("Lanyard request failed");
    const payload = await response.json();
    if (!payload.success) throw new Error("Lanyard returned an error");

    const data = payload.data;
    const user = data.discord_user;
    const displayName = user.global_name || user.username || "Discord user";

    lanyardName.textContent = displayName;
    setAvatar(user);
    setPresenceStatus(data.discord_status, data.discord_status);
    lanyardDetail.textContent = user.username ? `@${user.username}` : "Discord presence";
    lanyardActivity.textContent = formatActivity(data);
    updateMediaPlayer(data.spotify);
  } catch (error) {
    setPresenceStatus("offline", "Unavailable");
    lanyardDetail.textContent = "Could not load Lanyard right now.";
    lanyardActivity.textContent = "Check the Discord user ID and Lanyard setup.";
    setMediaIdle("Lanyard unavailable");
  }
}

function getWindow(id) {
  return document.getElementById(id);
}

function languageClass(language) {
  if (!language) return "";
  return language.replace(/[^a-z0-9_-]/gi, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRepos(repos) {
  if (!repoList) return;
  const visibleRepos = repos.slice(0, 20);
  repoList.innerHTML = visibleRepos.map((repo) => {
    const language = repo.language || "Code";
    const description = repo.description || "No description";
    return `
      <a class="repo-list-row" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
        <strong><img src="./assets/icons/folder.png" alt="" draggable="false" />${escapeHtml(repo.name)}</strong>
        <span>${escapeHtml(description)}</span>
        <small><i class="lang-dot ${languageClass(language)}"></i>${escapeHtml(language)} ★ ${repo.stargazers_count || 0}</small>
      </a>
    `;
  }).join("");

  repoCount.textContent = `${repos.length} repos`;
}

async function loadRepos() {
  if (!repoList) return;
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=20`);
    if (!response.ok) throw new Error("GitHub repos request failed");
    const repos = await response.json();
    renderRepos(repos);
  } catch (error) {
    repoCount.textContent = "offline";
  }
}

function seededLevel(index) {
  const value = Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1;
  if (value > 0.87) return 4;
  if (value > 0.73) return 3;
  if (value > 0.55) return 2;
  if (value > 0.38) return 1;
  return 0;
}

function contributionColor(level) {
  return ["#161b22", "#9be9a8", "#40c463", "#30a14e", "#216e39"][level] || "#161b22";
}

function paintContributionImage(rects, width) {
  const height = 88;
  const scale = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  rects.forEach((rect) => {
    context.fillStyle = contributionColor(rect.level);
    context.fillRect(rect.x, rect.y, 10, 10);
  });

  const image = document.createElement("img");
  image.className = "contrib-image";
  image.src = canvas.toDataURL("image/png");
  image.width = width;
  image.height = height;
  image.alt = "GitHub contribution heatmap";
  image.draggable = false;
  contribGrid.replaceChildren(image);
}

function renderFallbackContributions() {
  if (!contribGrid) return;
  const rects = [];
  let total = 0;
  for (let i = 0; i < 53 * 7; i += 1) {
    const level = seededLevel(i);
    const x = Math.floor(i / 7) * 13;
    const y = (i % 7) * 13;
    total += level;
    rects.push({ x, y, level });
  }
  paintContributionImage(rects, 686);
  const contribCount = document.querySelector("#contribCount");
  if (contribCount) contribCount.textContent = `${total} contributions in the last year`;
}

function startOfWeek(date) {
  const next = new Date(date);
  next.setDate(next.getDate() - next.getDay());
  next.setHours(0, 0, 0, 0);
  return next;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderMonthLabels(startDate, weeks) {
  if (!contribMonths) return;
  const formatter = new Intl.DateTimeFormat("en", { month: "short" });
  const labels = [];
  let lastMonth = -1;
  let lastLabelWeek = -4;

  for (let week = 0; week < weeks; week += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + week * 7);
    const month = date.getMonth();
    if (month !== lastMonth) {
      if (week - lastLabelWeek >= 4) {
        labels.push(`<span style="grid-column:${week + 1} / span 3">${formatter.format(date)}</span>`);
        lastLabelWeek = week;
      }
      lastMonth = month;
    }
  }

  contribMonths.innerHTML = labels.join("");
}

function renderAccurateContributions(contributions, total) {
  if (!contribGrid || !contributions?.length) {
    renderFallbackContributions();
    return;
  }

  const byDate = new Map(contributions.map((day) => [day.date, day]));
  const firstDate = new Date(`${contributions[0].date}T00:00:00`);
  const lastDate = new Date(`${contributions[contributions.length - 1].date}T00:00:00`);
  const startDate = startOfWeek(firstDate);
  const days = Math.ceil((lastDate - startDate) / 86400000) + 1;
  const weeks = Math.ceil(days / 7);
  const rects = [];

  renderMonthLabels(startDate, weeks);

  for (let i = 0; i < weeks * 7; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const key = dateKey(date);
    const day = byDate.get(key);
    const level = day?.level || 0;
    const count = day?.count || 0;
    if (!day) continue;

    const x = Math.floor(i / 7) * 13;
    const y = (i % 7) * 13;
    rects.push({ x, y, level, count, date: key });
  }

  paintContributionImage(rects, weeks * 13 - 3);
  const contribCount = document.querySelector("#contribCount");
  if (contribCount) contribCount.textContent = `${total} contributions in the last year`;
}

async function loadContributions() {
  try {
    const response = await fetch(CONTRIBUTIONS_API);
    if (!response.ok) throw new Error("Contributions request failed");
    const data = await response.json();
    renderAccurateContributions(data.contributions, data.total?.lastYear ?? 0);
  } catch (error) {
    renderFallbackContributions();
  }
}

function syncTaskbar() {
  taskButtons.forEach((button) => {
    const target = getWindow(button.dataset.open);
    button.classList.toggle("running", target?.classList.contains("active"));
    button.classList.toggle("active", target?.classList.contains("focused"));
  });
}

function focusWindow(win) {
  if (!win) return;
  windows.forEach((item) => item.classList.remove("focused"));
  win.classList.add("focused", "active");
  win.style.zIndex = String(++topZ);
  syncTaskbar();
}

function openWindow(id) {
  const win = getWindow(id === "documents" || id === "bin" ? "explorer" : id);
  if (!win) return;
  win.classList.add("active");
  focusWindow(win);
  startMenu.classList.remove("open");
}

function closeWindow(id) {
  const win = getWindow(id);
  if (!win) return;
  win.classList.remove("active", "focused");
  syncTaskbar();
}

function toggleMaximize(id) {
  const win = getWindow(id);
  if (!win) return;
  win.classList.toggle("maximized");
  focusWindow(win);
}

function beginDrag(event, win) {
  if (win.classList.contains("maximized") || event.target.closest(".window-controls")) return;
  const rect = win.getBoundingClientRect();
  dragState = {
    win,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
  win.setPointerCapture(event.pointerId);
  focusWindow(win);
}

function dragWindow(event) {
  if (!dragState) return;
  const { win, offsetX, offsetY } = dragState;
  const maxLeft = window.innerWidth - win.offsetWidth;
  const maxTop = window.innerHeight - win.offsetHeight - 40;
  const nextLeft = Math.max(0, Math.min(maxLeft, event.clientX - offsetX));
  const nextTop = Math.max(0, Math.min(maxTop, event.clientY - offsetY));
  win.style.left = `${nextLeft}px`;
  win.style.top = `${nextTop}px`;
}

function endDrag(event) {
  if (!dragState) return;
  dragState.win.releasePointerCapture(dragState.pointerId);
  dragState = null;
}

function showContextMenu(event) {
  if (event.target.closest(".window, .taskbar, .start-menu")) return;
  event.preventDefault();
  contextMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 204)}px`;
  contextMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 210)}px`;
  contextMenu.classList.add("open");
  startMenu.classList.remove("open");
}

startButton.addEventListener("click", (event) => {
  event.stopPropagation();
  startMenu.classList.toggle("open");
  contextMenu.classList.remove("open");
});

openButtons.forEach((button) => {
  button.addEventListener("click", () => openWindow(button.dataset.open));
});

windows.forEach((win) => {
  win.addEventListener("pointerdown", () => focusWindow(win));
  win.querySelector("[data-drag-handle]").addEventListener("pointerdown", (event) => beginDrag(event, win));
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => closeWindow(button.dataset.close));
});

document.querySelectorAll("[data-minimize]").forEach((button) => {
  button.addEventListener("click", () => closeWindow(button.dataset.minimize));
});

document.querySelectorAll("[data-maximize]").forEach((button) => {
  button.addEventListener("click", () => toggleMaximize(button.dataset.maximize));
});

document.addEventListener("pointermove", dragWindow);
document.addEventListener("pointerup", endDrag);
desktop.addEventListener("contextmenu", showContextMenu);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".start-menu, #startButton")) {
    startMenu.classList.remove("open");
  }
  if (!event.target.closest(".context-menu")) {
    contextMenu.classList.remove("open");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    startMenu.classList.remove("open");
    contextMenu.classList.remove("open");
  }
});

updateClock();
window.setInterval(updateClock, 1000);
focusWindow(getWindow("media"));
syncTaskbar();
updateLanyard();
window.setInterval(updateLanyard, 60000);
window.setInterval(updateMediaProgress, 1000);
loadRepos();
loadContributions();
refreshRepos?.addEventListener("click", loadRepos);

projectCards.forEach((card) => {
  card.addEventListener("click", () => {
    projectCards.forEach((item) => item.classList.toggle("selected", item === card));
    projectDetailTitle.textContent = card.dataset.projectTitle || "Project";
    projectDetailText.textContent = card.dataset.projectInfo || "No project details yet.";
    activeProjectsBody.classList.add("detail-open");
  });
});

projectBack?.addEventListener("click", () => {
  activeProjectsBody.classList.remove("detail-open");
});
