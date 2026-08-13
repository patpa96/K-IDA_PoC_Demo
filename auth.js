(function () {
  "use strict";

  // SHA-256 of the access token. Only the hash lives in this file so the
  // token itself isn't visible in the page source; this is a soft PoC
  // gate against casual/accidental visitors, not real access control
  // (GitHub Pages has no backend to enforce this server-side).
  var TOKEN_HASH = "62e69749a2dd84d35c040108976d960ada530fbd611680b8860e7b5a44fa31ba";
  var SESSION_KEY = "kida-auth-unlocked";

  var gate = document.getElementById("auth-gate");
  var dashboard = document.getElementById("dashboard");
  var form = document.getElementById("auth-form");
  var input = document.getElementById("auth-token-input");
  var errorEl = document.getElementById("auth-error");

  function hashToken(value) {
    var data = new TextEncoder().encode(value);
    return crypto.subtle.digest("SHA-256", data).then(function (buffer) {
      var bytes = Array.from(new Uint8Array(buffer));
      return bytes.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    });
  }

  function unlock(persist) {
    gate.hidden = true;
    dashboard.hidden = false;
    if (persist) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch (e) {
        /* sessionStorage unavailable (e.g. private mode) - unlock still works for this load */
      }
    }
  }

  function showError() {
    errorEl.hidden = false;
    gate.querySelector(".auth-card").classList.remove("shake");
    // restart animation
    void gate.querySelector(".auth-card").offsetWidth;
    gate.querySelector(".auth-card").classList.add("shake");
    input.value = "";
    input.focus();
  }

  function tryUnlockWithToken(value, persist) {
    if (!value) return Promise.resolve(false);
    return hashToken(value).then(function (hash) {
      if (hash === TOKEN_HASH) {
        unlock(persist);
        return true;
      }
      return false;
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    tryUnlockWithToken(input.value, true).then(function (ok) {
      if (!ok) showError();
    });
  });

  var alreadyUnlocked = false;
  try {
    alreadyUnlocked = sessionStorage.getItem(SESSION_KEY) === "1";
  } catch (e) {
    /* ignore */
  }

  if (alreadyUnlocked) {
    unlock(false);
  } else {
    var params = new URLSearchParams(window.location.search);
    var urlToken = params.get("token");
    if (urlToken) {
      tryUnlockWithToken(urlToken, true).then(function (ok) {
        if (ok) {
          // Strip the token from the URL/history so it isn't kept in
          // browser history, bookmarks, or leaked via the Referer header.
          params.delete("token");
          var newSearch = params.toString();
          var newUrl =
            window.location.pathname + (newSearch ? "?" + newSearch : "") + window.location.hash;
          window.history.replaceState({}, "", newUrl);
        }
      });
    }
  }
})();
