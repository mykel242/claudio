/**
 * Main application controller
 */
document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");
  const micButton = document.getElementById("micButton");
  const stopButton = document.getElementById("stopButton");
  const playFileButton = document.getElementById("playFile");
  const audioFileInput = document.getElementById("audioFile");
  const visualTypeSelect = document.getElementById("visualType");
  const barCountInput = document.getElementById("barCount");
  const barCountValue = document.getElementById("barCountValue");
  const colorSchemeSelect = document.getElementById("colorScheme");
  const peakDecayInput = document.getElementById("peakDecay");
  const peakDecayValue = document.getElementById("peakDecayValue");
  const innerRadiusInput = document.getElementById("innerRadius");
  const innerRadiusValue = document.getElementById("innerRadiusValue");
  const maxBarLengthInput = document.getElementById("maxBarLength");
  const maxBarLengthValue = document.getElementById("maxBarLengthValue");
  const statusElement = document.getElementById("status");

  // Initialize canvas
  Utils.setupCanvasResizing(canvas);

  // Initialize audio controller
  const audioController = new AudioController(statusElement);

  // Initialize visualizers
  const barsVisualizer = new BarsVisualizer(canvas, ctx);
  const waveVisualizer = new WaveVisualizer(canvas, ctx);
  const circleVisualizer = new CircleVisualizer(canvas, ctx);

  // Animation variables
  let animationId = null;
  let lastFrameTime = 0;

  /**
   * Main visualization loop
   */
  function visualize() {
    if (!audioController.isPlaying) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    animationId = requestAnimationFrame(visualize);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const visualType = visualTypeSelect.value;
    const colorScheme = colorSchemeSelect.value;
    const decayMs = parseInt(peakDecayInput.value);
    const barCount = parseInt(barCountInput.value);
    const innerRadius = parseFloat(innerRadiusInput.value);
    const maxBarLength = parseInt(maxBarLengthInput.value);

    switch (visualType) {
      case "bars":
        const freqData = audioController.getFrequencyData();
        barsVisualizer.draw(
          freqData,
          colorScheme,
          deltaTime,
          decayMs,
          barCount,
        );
        break;
      case "wave":
        const timeData = audioController.getTimeData();
        waveVisualizer.draw(timeData, colorScheme);
        break;
      case "circle":
        const circleData = audioController.getFrequencyData();
        circleVisualizer.draw(
          circleData,
          colorScheme,
          deltaTime,
          decayMs,
          barCount,
          innerRadius,
          maxBarLength,
        );
        break;
    }
  }

  /**
   * Start audio visualization from microphone
   */
  async function startMicrophone() {
    const success = await audioController.useMicrophone();
    if (success) {
      Utils.updateButtonStates(
        true,
        micButton,
        stopButton,
        playFileButton,
        audioFileInput,
      );
      lastFrameTime = performance.now();
      visualize();
    }
  }

  /**
   * Start audio visualization from file
   */
  async function startAudioFile() {
    const file = audioFileInput.files[0];
    const success = await audioController.playAudioFile(file);
    if (success) {
      Utils.updateButtonStates(
        true,
        micButton,
        stopButton,
        playFileButton,
        audioFileInput,
      );
      lastFrameTime = performance.now();
      visualize();
    }
  }

  /**
   * Stop audio visualization
   */
  function stopVisualization() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    audioController.stopAudio();
    Utils.updateButtonStates(
      false,
      micButton,
      stopButton,
      playFileButton,
      audioFileInput,
    );

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Event listeners
  micButton.addEventListener("click", startMicrophone);
  stopButton.addEventListener("click", stopVisualization);
  playFileButton.addEventListener("click", startAudioFile);

  audioFileInput.addEventListener("change", function () {
    if (this.files.length > 0) {
      playFileButton.disabled = false;
      playFileButton.textContent = "Play: " + this.files[0].name;
    }
  });

  visualTypeSelect.addEventListener("change", function () {
    if (audioController.isPlaying) {
      // Re-visualize with new type if already playing
      cancelAnimationFrame(animationId);
      visualize();
    }

    // Show/hide circle-specific options
    const circleOptions = document.querySelectorAll(".circle-option");
    circleOptions.forEach((option) => {
      option.style.display = this.value === "circle" ? "flex" : "none";
    });
  });

  barCountInput.addEventListener("input", function () {
    barCountValue.textContent = this.value;
    // Reset peaks arrays when bar count changes
    barsVisualizer.peaks = [];
    circleVisualizer.peaks = [];
  });

  peakDecayInput.addEventListener("input", function () {
    peakDecayValue.textContent = this.value;
  });

  innerRadiusInput.addEventListener("input", function () {
    innerRadiusValue.textContent = this.value;
  });

  maxBarLengthInput.addEventListener("input", function () {
    maxBarLengthValue.textContent = this.value;
  });

  // Initialize circle options visibility
  const circleOptions = document.querySelectorAll(".circle-option");
  circleOptions.forEach((option) => {
    option.style.display =
      visualTypeSelect.value === "circle" ? "flex" : "none";
  });

  // Handle audio file drag and drop
  canvas.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = "#2a2a2a";
  });

  canvas.addEventListener("dragleave", function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = "#1e1e1e";
  });

  canvas.addEventListener("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = "#1e1e1e";

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.match("audio.*")) {
      audioFileInput.files = files;
      playFileButton.disabled = false;
      playFileButton.textContent = "Play: " + files[0].name;
      startAudioFile();
    }
  });
});
