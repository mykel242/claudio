/**
 * Waveform visualizer
 */
class WaveVisualizer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.peaks = [];
    this.peakDots = [];
  }

  /**
   * Draw waveform visualization
   * @param {Uint8Array} timeDataArray - Audio time domain data
   * @param {string} colorScheme - Color scheme to use
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   * @param {number} decayMs - Peak decay time in milliseconds
   */
  draw(timeDataArray, colorScheme, deltaTime = 16, decayMs = 1000) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const bufferLength = timeDataArray.length;
    const sliceWidth = width / bufferLength;

    this.ctx.lineWidth = 2;

    // Set color based on selected scheme
    this.ctx.strokeStyle = ColorUtils.getWaveformColor(
      this.ctx,
      width,
      colorScheme,
    );

    this.ctx.beginPath();

    // Initialize peak tracking arrays if needed
    if (!this.peaks.length || this.peaks.length !== bufferLength) {
      this.peaks = Array(bufferLength).fill(0);
      this.peakDots = Array(bufferLength).fill(null);
    }

    // Calculate decay rate
    const decayRate = deltaTime / decayMs;

    // Draw the waveform
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = timeDataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      // Check for new peak (values further from 1.0 are more "peaked")
      const peakValue = Math.abs(v - 1.0);

      if (peakValue > this.peaks[i]) {
        this.peaks[i] = peakValue;

        // Create a new peak dot
        this.peakDots[i] = {
          x: x,
          y: y,
          createdAt: performance.now(),
          value: peakValue,
        };
      }

      // Decay the peak over time
      this.peaks[i] = Math.max(0, this.peaks[i] - decayRate);

      // If peak decayed to 0, remove the dot
      if (this.peaks[i] === 0) {
        this.peakDots[i] = null;
      }

      x += sliceWidth;
    }

    this.ctx.stroke();

    // Draw peak dots
    this.drawPeakDots(decayMs);
  }

  /**
   * Draw peak dots with opacity based on time elapsed
   * @param {number} decayMs - Peak decay time in milliseconds
   */
  drawPeakDots(decayMs) {
    const currentTime = performance.now();

    // Only draw a subset of peaks (1 every 50 indices) to avoid too many dots
    for (let i = 0; i < this.peakDots.length; i += 50) {
      const dot = this.peakDots[i];
      if (!dot) continue;

      // Calculate opacity based on time elapsed since creation
      const timeSincePeak = currentTime - dot.createdAt;
      const normalizedTime = Math.min(timeSincePeak / decayMs, 1);
      const opacity = 1 - normalizedTime;

      if (opacity > 0) {
        // Draw the peak dot
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.fill();
      }
    }
  }
}
