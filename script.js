(function () {
  "use strict";

  // Cognigy VoiceGateway WebRTC endpoint ("Ida - AI Agent" flow).
  var ENDPOINT_URL =
    "https://endpoint-trial.cognigy.ai/f4621d3ec12b0c29e593f15193344531067f38d326a64e78fc5430e41dfca292/voiceGateway";

  var tile = document.getElementById("help-contact-tile");
  var label = document.getElementById("help-contact-label");
  var defaultLabelText = label.textContent;

  var widget = null;
  var callState = "idle"; // idle | connecting | active
  var findButtonAttempts = 0;
  var MAX_FIND_ATTEMPTS = 20;

  function setState(state, labelText) {
    callState = state;
    tile.classList.remove("is-connecting", "is-active");
    if (state === "connecting") tile.classList.add("is-connecting");
    if (state === "active") tile.classList.add("is-active");
    label.textContent = labelText || defaultLabelText;
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
            callButton: "Hilfe & Kontakt",
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
  // from our tile to those real buttons so Cognigy handles mic permission
  // and SIP session setup while our dashboard tile keeps its own look.
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

  tile.addEventListener("click", function () {
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
