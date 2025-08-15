// V5 Dice Roller Implementation - Mobile Optimized
let currentRolls = { normal: [], hunger: [] };
let currentDifficulty = null;
let rerollMode = false;
let selectedDice = [];
let isInitialized = false;

// Prevent zoom on double-tap for iOS
document.addEventListener(
  "touchend",
  function (event) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);

let lastTouchEnd = 0;

function initializeDiceRoller() {
  if (isInitialized) {
    return;
  }

  // Use event delegation on the container with better touch support
  const viewPanel = document.getElementById("view-panel");
  if (viewPanel) {
    viewPanel.addEventListener("click", handleDiceRollerClicks);
    viewPanel.addEventListener("touchend", handleDiceRollerClicks);
  }

  // Add keyboard support for accessibility
  document.addEventListener("keydown", handleKeyboardInput);

  // Add input validation listeners
  setupInputValidation();

  isInitialized = true;
}

function setupInputValidation() {
  const totalDiceInput = document.getElementById("total-dice");
  const hungerDiceInput = document.getElementById("hunger-dice");
  const difficultyInput = document.getElementById("difficulty");

  if (totalDiceInput) {
    totalDiceInput.addEventListener("input", validateInputs);
    totalDiceInput.addEventListener("change", validateInputs);
  }
  if (hungerDiceInput) {
    hungerDiceInput.addEventListener("input", validateInputs);
    hungerDiceInput.addEventListener("change", validateInputs);
  }
  if (difficultyInput) {
    difficultyInput.addEventListener("input", validateInputs);
  }
}

function validateInputs() {
  const totalDice = parseInt(document.getElementById("total-dice").value) || 0;
  const hungerDice =
    parseInt(document.getElementById("hunger-dice").value) || 0;
  const rollButton = document.getElementById("roll-button");

  // Auto-adjust hunger dice if it exceeds total dice
  if (hungerDice > totalDice && totalDice > 0) {
    document.getElementById("hunger-dice").value = totalDice;
  }

  // Validate ranges
  if (totalDice < 1 || totalDice > 20) {
    rollButton.disabled = true;
  } else if (hungerDice < 0 || hungerDice > 5) {
    rollButton.disabled = true;
  } else {
    rollButton.disabled = false;
  }
}

function handleKeyboardInput(event) {
  // Handle Enter key on inputs
  if (
    event.key === "Enter" &&
    event.target.classList.contains("roller__input")
  ) {
    event.preventDefault();
    handleDiceRoll();
  }

  // Handle Escape key to cancel reroll
  if (event.key === "Escape" && rerollMode) {
    cancelReroll();
  }
}

function showNotification(message, type = "info") {
  // Don't show notifications in the results div if we have dice displayed
  if (currentRolls.normal.length > 0 || currentRolls.hunger.length > 0) {
    // Create a temporary notification element instead
    const notification = document.createElement("div");
    notification.className =
      type === "error" ? "roller__error" : "roller__warning";
    notification.textContent = message;
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.left = "50%";
    notification.style.transform = "translateX(-50%)";
    notification.style.zIndex = "1000";
    notification.style.maxWidth = "90vw";

    document.body.appendChild(notification);

    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 3000);
  } else {
    // Use the original method if no dice are displayed
    const resultsDiv = document.getElementById("roller-results");
    const className = type === "error" ? "roller__error" : "roller__warning";
    resultsDiv.innerHTML = `<p class="${className}">${message}</p>`;

    // Auto-clear notification after 3 seconds
    setTimeout(() => {
      if (resultsDiv.innerHTML.includes(message)) {
        resultsDiv.innerHTML =
          '<p class="roller__placeholder">Click "Roll Dice" to see results</p>';
      }
    }, 3000);
  }
}

function handleDiceRollerClicks(event) {
  const target = event.target;

  // Don't prevent default for input fields
  if (target.classList.contains("roller__input")) {
    return;
  }

  // Prevent default for touch events to avoid double firing
  if (event.type === "touchend") {
    event.preventDefault();
  }

  switch (target.id) {
    case "roll-button":
      handleDiceRoll();
      break;
    case "rouse-button":
      handleRouseCheck();
      break;
    case "clear-button":
      clearDice();
      break;
    case "willpower-reroll-button":
      startWillpowerReroll();
      break;
    case "execute-reroll-button":
      executeReroll();
      break;
    case "cancel-reroll-button":
      cancelReroll();
      break;
    case "add-normal-button":
      addDie(false);
      break;
    case "add-hunger-button":
      addDie(true);
      break;
  }

  // Handle dice clicks for reroll - check if target or parent is a die
  if (
    target.classList.contains("roller__die--clickable") ||
    target.closest(".roller__die--clickable")
  ) {
    const dieElement = target.classList.contains("roller__die--clickable")
      ? target
      : target.closest(".roller__die--clickable");

    // Find all normal dice in the same container
    const diceContainer = dieElement.closest(".roller__dice-container");
    const allNormalDice = Array.from(
      diceContainer.querySelectorAll(".roller__die--normal")
    );
    const index = allNormalDice.indexOf(dieElement);

    if (index !== -1) {
      toggleDieSelection(index);
      // Add haptic feedback on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }
}

function handleDiceRoll() {
  const totalDice = parseInt(document.getElementById("total-dice").value) || 0;
  const hungerDice =
    parseInt(document.getElementById("hunger-dice").value) || 0;
  const difficulty =
    parseInt(document.getElementById("difficulty").value) || null;

  // Additional mobile-friendly validation
  if (totalDice < 1) {
    showNotification("You must roll at least 1 die!", "error");
    return;
  }

  if (hungerDice > totalDice) {
    showNotification("Hunger dice cannot exceed total dice!", "error");
    return;
  }

  if (hungerDice > 5) {
    showNotification("Hunger dice cannot exceed 5!", "error");
    return;
  }

  currentDifficulty = difficulty;
  rollV5Dice(totalDice, hungerDice, difficulty);

  // Add success haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

function handleRouseCheck() {
  // Automatically set values for Rouse Check
  currentDifficulty = 1;
  rollV5Dice(1, 1, 1); // 1 total die, 1 hunger die, difficulty 1
}

function clearDice() {
  currentRolls = { normal: [], hunger: [] };
  currentDifficulty = null;
  rerollMode = false;
  selectedDice = [];

  const resultsDiv = document.getElementById("roller-results");
  const postControls = document.getElementById("post-controls");
  const clearButton = document.getElementById("clear-button");

  resultsDiv.innerHTML =
    '<p class="roller__placeholder">Click "Roll Dice" to see results</p>';
  if (postControls) {
    postControls.style.display = "none";
  }
  clearButton.disabled = true;

  exitRerollMode();
}

function startWillpowerReroll() {
  if (currentRolls.normal.length === 0) {
    showNotification("No normal dice to reroll!", "error");
    return;
  }

  rerollMode = true;
  selectedDice = [];

  document.getElementById("reroll-instructions").style.display = "block";
  document.getElementById("reroll-button-container").style.display = "grid";
  document.getElementById("willpower-reroll-button").disabled = true;

  // Make normal dice clickable and update display
  updateDiceDisplay();

  // Show instruction differently to avoid replacing dice display
  console.log("Willpower reroll mode activated - tap up to 3 normal dice");
}

function cancelReroll() {
  exitRerollMode();
  updateDiceDisplay();
}

function exitRerollMode() {
  rerollMode = false;
  selectedDice = [];

  document.getElementById("reroll-instructions").style.display = "none";
  document.getElementById("reroll-button-container").style.display = "none";
  document.getElementById("willpower-reroll-button").disabled = false;
}

function executeReroll() {
  if (selectedDice.length === 0) {
    showNotification("Please select at least one die to reroll!", "error");
    return;
  }

  // Add rerolling feedback
  showNotification(`🎲 Rerolling ${selectedDice.length} dice...`, "info");

  setTimeout(() => {
    // Reroll selected dice
    selectedDice.forEach((index) => {
      currentRolls.normal[index] = rollDie();
    });

    exitRerollMode();
    updateDiceDisplay();

    // Add success haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, 300);
}

function addDie(isHunger) {
  const newRoll = rollDie();

  if (isHunger) {
    if (currentRolls.hunger.length >= 5) {
      showNotification("Cannot have more than 5 hunger dice!", "error");
      return;
    }
    currentRolls.hunger.push(newRoll);
    showNotification(`Added hunger die: ${newRoll}`, "info");
  } else {
    currentRolls.normal.push(newRoll);
    showNotification(`Added normal die: ${newRoll}`, "info");
  }

  updateDiceDisplay();

  // Add haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(100);
  }
}

function rollV5Dice(totalDice, hungerDice, difficulty = null) {
  const resultsDiv = document.getElementById("roller-results");
  const postControls = document.getElementById("post-controls");
  const clearButton = document.getElementById("clear-button");

  // Validation with user-friendly messages
  if (totalDice < 1) {
    showNotification("You must roll at least 1 die!", "error");
    return;
  }

  if (hungerDice > totalDice) {
    showNotification("Hunger dice cannot exceed total dice!", "error");
    return;
  }

  if (hungerDice > 5) {
    showNotification("Hunger dice cannot exceed 5!", "error");
    return;
  }

  // Calculate dice counts
  const normalDiceCount = totalDice - hungerDice;
  currentRolls.normal = [];
  currentRolls.hunger = [];

  // Add rolling animation delay for better UX
  resultsDiv.innerHTML =
    '<p class="roller__placeholder">🎲 Rolling dice...</p>';

  setTimeout(() => {
    // Roll the dice
    for (let i = 0; i < normalDiceCount; i++) {
      currentRolls.normal.push(rollDie());
    }

    for (let i = 0; i < hungerDice; i++) {
      currentRolls.hunger.push(rollDie());
    }

    updateDiceDisplay();

    // Show post-roll controls
    if (postControls) {
      postControls.style.display = "block";
    }
    clearButton.disabled = false;
  }, 500); // Half second delay for drama
}

function updateDiceDisplay() {
  const resultsDiv = document.getElementById("roller-results");

  // Calculate results
  const { successes, outcome, outcomeClass, hungerOnes } = calculateResults();

  // Build results HTML
  let html = '<div class="roller__result-section">';

  if (currentRolls.normal.length > 0) {
    html += `<div class="roller__dice-result">
      <span class="roller__dice-label">Normal Dice:</span>
      <div class="roller__dice-container">
        ${currentRolls.normal
          .map((val, index) => formatDie(val, false, index))
          .join("")}
      </div>
    </div>`;
  }

  if (currentRolls.hunger.length > 0) {
    html += `<div class="roller__dice-result roller__dice-result--hunger">
      <span class="roller__dice-label">Hunger Dice:</span>
      <div class="roller__dice-container">
        ${currentRolls.hunger
          .map((val, index) => formatDie(val, true, index))
          .join("")}
      </div>
    </div>`;
  }

  html += `<p class="roller__success-count">Successes: <strong>${successes}</strong></p>`;
  html += `<p class="roller__outcome ${outcomeClass}">${outcome}</p>`;

  // Add hunger warning if needed
  if (hungerOnes > 0 && successes >= (currentDifficulty || 0)) {
    html += `<p class="roller__warning">⚠️ Hunger die rolled 1: Bestial Compulsion possible!</p>`;
  }

  html += "</div>";
  resultsDiv.innerHTML = html;
}

function calculateResults() {
  let successes = 0;
  let normalTens = 0;
  let hungerTens = 0;
  let hungerOnes = 0;

  // Process normal dice
  currentRolls.normal.forEach((val) => {
    if (val >= 6 && val < 10) successes++;
    if (val === 10) {
      normalTens++;
      successes++;
    }
  });

  // Process hunger dice
  currentRolls.hunger.forEach((val) => {
    if (val >= 6 && val < 10) successes++;
    if (val === 10) {
      hungerTens++;
      successes++;
    }
    if (val === 1) hungerOnes++;
  });

  // Calculate critical successes
  const totalTens = normalTens + hungerTens;
  const critPairs = Math.floor(totalTens / 2);
  successes += critPairs * 2;

  const hasCrit = critPairs >= 1;
  const messyCrit = hasCrit && hungerTens > 0;

  // Determine outcome
  let outcome = "";
  let outcomeClass = "";

  // Check if this was a Rouse Check
  const isRouteCheck =
    currentRolls.normal.length === 0 &&
    currentRolls.hunger.length === 1 &&
    currentDifficulty === 1;

  if (isRouteCheck) {
    if (successes >= 1) {
      outcome = `✅ Rouse Check Success - No Hunger gained`;
      outcomeClass = "roller__outcome--success";
    } else {
      outcome = `❌ Rouse Check Failed - Hunger increases by 1`;
      outcomeClass = "roller__outcome--failure";
      if (hungerOnes > 0) {
        outcome = `💀 Rouse Check Bestial Failure - Hunger increases & Compulsion check`;
        outcomeClass = "roller__outcome--bestial-failure";
      }
    }
    return { successes, outcome, outcomeClass, hungerOnes };
  }

  if (currentDifficulty !== null) {
    if (successes >= currentDifficulty) {
      if (messyCrit) {
        outcome = `✅ Messy Critical Success (${successes}/${currentDifficulty})`;
        outcomeClass = "roller__outcome--messy-success";
      } else if (hasCrit) {
        outcome = `✅ Critical Success (${successes}/${currentDifficulty})`;
        outcomeClass = "roller__outcome--critical";
      } else {
        outcome = `✅ Success (${successes}/${currentDifficulty})`;
        outcomeClass = "roller__outcome--success";
      }
    } else {
      if (hungerOnes > 0) {
        outcome = `❌ Bestial Failure (${successes}/${currentDifficulty})`;
        outcomeClass = "roller__outcome--bestial-failure";
      } else {
        outcome = `❌ Failure (${successes}/${currentDifficulty})`;
        outcomeClass = "roller__outcome--failure";
      }
    }
  } else {
    outcome = `Total Successes: ${successes}`;
    outcomeClass = "roller__outcome--neutral";

    if (messyCrit) {
      outcome += "<br>⚠️ Messy Critical Possible!";
    } else if (hasCrit) {
      outcome += "<br>★ Critical Possible!";
    }
  }

  return { successes, outcome, outcomeClass, hungerOnes };
}

function formatDie(value, isHunger = false, index = 0) {
  let diceClass = "roller__die";
  let symbol = "";

  if (isHunger) {
    diceClass += " roller__die--hunger";
    if (value === 1) {
      diceClass += " roller__die--bestial";
      symbol = "💀";
    } else if (value >= 2 && value <= 5) {
      diceClass += " roller__die--fail";
      symbol = "✖";
    } else if (value >= 6 && value <= 9) {
      diceClass += " roller__die--success";
      symbol = "✓";
    } else if (value === 10) {
      diceClass += " roller__die--crit";
      symbol = "★";
    }
  } else {
    diceClass += " roller__die--normal";
    if (value >= 1 && value <= 5) {
      diceClass += " roller__die--fail";
      symbol = "○";
    } else if (value >= 6 && value <= 9) {
      diceClass += " roller__die--success";
      symbol = "●";
    } else if (value === 10) {
      diceClass += " roller__die--crit";
      symbol = "◆";
    }

    // Add clickable class for reroll mode
    if (rerollMode) {
      diceClass += " roller__die--clickable";
      if (selectedDice.includes(index)) {
        diceClass += " roller__die--selected";
      }
    }
  }

  // Remove inline onclick handler since we're using event delegation
  return `<div class="${diceClass}" data-die-index="${index}">
    <div class="roller__die-symbol">${symbol}</div>
    <div class="roller__die-value">${value}</div>
  </div>`;
}

function toggleDieSelection(index) {
  if (!rerollMode) return;

  const selectedIndex = selectedDice.indexOf(index);

  if (selectedIndex > -1) {
    // Remove from selection
    selectedDice.splice(selectedIndex, 1);
  } else {
    // Add to selection (max 3)
    if (selectedDice.length < 3) {
      selectedDice.push(index);
    } else {
      showNotification(
        "You can only reroll up to 3 dice with Willpower!",
        "error"
      );
      return;
    }
  }

  updateDiceDisplay();

  // Add haptic feedback for selection
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

function rollDie() {
  return Math.floor(Math.random() * 10) + 1;
}

// Make functions globally available
window.toggleDieSelection = toggleDieSelection;

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDiceRoller);
} else {
  initializeDiceRoller();
}

// Export for use in other modules if needed
window.rollV5Dice = rollV5Dice;
window.initializeDiceRoller = initializeDiceRoller;

// Service Worker registration for PWA capabilities (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // You can add a service worker here for offline functionality
  });
}
