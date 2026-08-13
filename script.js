(function () {
  "use strict";

  // Cognigy VoiceGateway WebRTC endpoint ("Ida - AI Agent" flow).
  var ENDPOINT_URL =
    "https://endpoint-trial.cognigy.ai/f4621d3ec12b0c29e593f15193344531067f38d326a64e78fc5430e41dfca292/voiceGateway";

  var tilesGrid = document.getElementById("tiles-grid");
  var helpScreen = document.getElementById("help-screen");
  var helpContactTile = document.getElementById("help-contact-tile");
  var helpBack = document.getElementById("help-back");
  var inforufBtn = document.getElementById("inforuf-btn");
  var inforufLabel = document.getElementById("inforuf-label");
  var defaultLabelText = inforufLabel.textContent;

  var widget = null;
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

  function initWidget() {
    if (typeof window.initWebRTCWidget !== "function") {
      // Widget script not loaded yet or failed to load; retry shortly.
      setTimeout(initWidget, 300);
      return;
    }

    window
      .initWebRTCWidget(ENDPOINT_URL, {
        ui: {
          labels: {
            callButton: "Inforuf",
            endButton: "Anruf beenden",
            listenLabel: "IDA hört zu ...",
          },
        },
      })
      .then(function (createdWidget) {
        widget = createdWidget;
        bindWidgetEvents(widget);
      })
      .catch(function (err) {
        console.error("Cognigy WebRTC Widget konnte nicht initialisiert werden:", err);
        setState("idle", "Nicht erreichbar");
      });
  }

  function bindWidgetEvents(widget) {
    if (!widget || typeof widget.on !== "function") return;

    widget.on("newRTCSession", function (session) {
      setState("active", "Auflegen");

      session.on("answered", function () {
        setState("active", "Verbunden – Auflegen");
      });
      session.on("failed", resetToIdle);
      session.on("ended", resetToIdle);
      session.on("terminated", resetToIdle);
    });

    widget.on("registrationFailed", function () {
      setState("idle", "Nicht erreichbar");
    });
  }

  function resetToIdle() {
    setState("idle");
  }

  // The widget renders its own call/end-call buttons; we forward clicks
  // from our "Inforuf" button to those real buttons so Cognigy handles
  // mic permission and SIP session setup while our own button keeps its
  // dashboard look.
  function findWidgetButton(selector) {
    return document.querySelector(selector);
  }

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
    resetToIdle();
  }

  inforufBtn.addEventListener("click", function () {
    if (callState === "idle") {
      startCall();
    } else if (callState === "active") {
      endCall();
    }
  });

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

  window.addEventListener("load", initWidget);
})();
