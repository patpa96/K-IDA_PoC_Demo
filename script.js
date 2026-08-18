(function () {
  "use strict";

  // Cognigy WebRTC widget init call itself lives inline in index.html,
  // matching Miriam's confirmed-working snippet verbatim (single argument,
  // no options object) - this file only wires our own UI to it.

  var tilesGrid = document.getElementById("tiles-grid");
  var helpScreen = document.getElementById("help-screen");
  var helpContactTile = document.getElementById("help-contact-tile");
  var helpBack = document.getElementById("help-back");
  var inforufBtn = document.getElementById("inforuf-btn");
  var inforufLabel = document.getElementById("inforuf-label");
  var defaultLabelText = inforufLabel.textContent;

  var callState = "idle"; // idle | connecting | active
  var findButtonAttempts = 0;
  var MAX_FIND_ATTEMPTS = 20;

  function showHelpScreen() {
    tilesGrid.hidden = true;
    helpScreen.hidden = false;
  }

  function showTilesGrid() {
    helpScreen.hidden = true;
    tilesGrid.hidden = false;
  }

  helpContactTile.addEventListener("click", showHelpScreen);
  helpBack.addEventListener("click", showTilesGrid);

  function setState(state, labelText) {
    callState = state;
    inforufBtn.classList.remove("help-option--calling", "help-option--active");
    if (state === "connecting") inforufBtn.classList.add("help-option--calling");
    if (state === "active") inforufBtn.classList.add("help-option--active");
    inforufLabel.textContent = labelText || defaultLabelText;
  }

  function findWidgetButton(selector) {
    return document.querySelector(selector);
  }

  // The widget renders its own call/end-call buttons; we forward clicks
  // from our "Inforuf" button to those real buttons so Cognigy handles
  // mic permission and SIP session setup while our own button keeps its
  // dashboard look.
  function startCall() {
    var callButton = findWidgetButton(".webrtc_widget_call_button");
    if (callButton) {
      findButtonAttempts = 0;
      setState("connecting", "Verbinde ...");
      callButton.click();
      return;
    }
    if (findButtonAttempts >= MAX_FIND_ATTEMPTS) {
      findButtonAttempts = 0;
      setState("idle", "Nicht erreichbar");
      return;
    }
    findButtonAttempts += 1;
    setState("connecting", "Verbinde ...");
    setTimeout(startCall, 300);
  }

  function endCall() {
    var endButton = findWidgetButton(".webrtc_widget_end_call_button");
    if (endButton) {
      endButton.click();
    }
    setState("idle");
  }

  inforufBtn.addEventListener("click", function () {
    if (callState === "idle") {
      startCall();
    } else if (callState === "active") {
      endCall();
    }
  });

  // We don't have a reference to the widget instance (its init call lives
  // in its own inline <script> in index.html), so an active call is
  // detected by watching for the widget's own end-call button appearing/
  // disappearing in the DOM instead of listening to widget.on(...) events.
  var callObserver = new MutationObserver(function () {
    var endButtonPresent = !!findWidgetButton(".webrtc_widget_end_call_button");
    if (endButtonPresent && callState !== "active") {
      setState("active", "Auflegen");
    } else if (!endButtonPresent && callState === "active") {
      setState("idle");
    }
  });
  callObserver.observe(document.body, { childList: true, subtree: true });

  function updateClock() {
    var clockEl = document.getElementById("clock");
    if (!clockEl) return;
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, "0");
    var mm = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = hh + ":" + mm;
  }

  updateClock();
  setInterval(updateClock, 15000);
})();
