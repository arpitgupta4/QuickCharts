/*************************************************
 * QUICKCHARTS — GOOGLE AUTH (FINAL)
 *************************************************/

/* ================= CONFIG ================= */

const CLIENT_ID =
  "790473792684-nrkm9lre9b898bgphd8tl5vtelpacehp.apps.googleusercontent.com";

const SHEET_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzsqGp9EMWbJVkmFIEnGAv0bMZ-GhGr7gqYdmYVQYcOYO0OQ0AGiLHGOyhTs6vLIGUw/exec";

const IS_ANDROID_APP = /Android/i.test(navigator.userAgent);

/* ================= APP LOCK ================= */

function lockApp() {
  document.getElementById("login-screen")?.classList.remove("hidden");
  document.getElementById("app")?.classList.add("hidden");
}

function unlockApp() {
  document.getElementById("login-screen")?.classList.add("hidden");
  document.getElementById("app")?.classList.remove("hidden");
}

/* ================= INIT ================= */

function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleGoogleLogin,
  });

  google.accounts.id.renderButton(
    document.getElementById("google-btn"),
    {
      theme: "outline",
      size: "large",
      width: 280,
      text: "continue_with",
    }
  );
}

/* ================= LOGIN ================= */

function handleGoogleLogin(response) {
  const payload = JSON.parse(
    atob(response.credential.split(".")[1])
  );

  const user = {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };

  localStorage.setItem("qc_user", JSON.stringify(user));
  saveUserToSheet(user);
  renderUserProfile(user);
}

/* ================= GOOGLE SHEET ================= */

function saveUserToSheet(user) {
  fetch(SHEET_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      email: user.email,
      name: user.name,
    }),
  });
}

/* ================= UI ================= */

function renderUserProfile(user) {
  unlockApp();

  const userArea = document.getElementById("user-area");
  const avatar = document.getElementById("user-avatar");
  const menuAvatar = document.getElementById("menu-avatar");

  userArea.classList.remove("hidden");

  avatar.src = user.picture;
  menuAvatar.src = user.picture;

  document.getElementById("user-name").innerText = user.name;
  document.getElementById("user-email").innerText = user.email;

  const menu = document.getElementById("user-menu");
  const btn = document.getElementById("profile-btn");

  btn.onclick = e => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
  };

  // Click outside to close
  document.addEventListener("click", e => {
    if (!userArea.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });
}


/* ================= LOGOUT ================= */

function logout() {
  localStorage.removeItem("qc_user");
  lockApp();
}

/* ================= AUTO LOGIN ================= */

(function autoLogin() {

  // ✅ ANDROID APP = VIEWER MODE (NO LOGIN)
  if (IS_ANDROID_APP) {
    unlockApp();
    return;
  }

  // 🌐 BROWSER MODE = LOGIN REQUIRED
  const saved = localStorage.getItem("qc_user");

  if (!saved) {
    lockApp();
    return;
  }

  try {
    renderUserProfile(JSON.parse(saved));
  } catch {
    localStorage.removeItem("qc_user");
    lockApp();
  }
})();




/* ================= START ================= */

window.addEventListener("load", initGoogleAuth);
