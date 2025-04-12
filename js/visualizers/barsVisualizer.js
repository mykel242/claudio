/**
 * Frequency bars visualizer with distribution matching circular visualizer
 */
class BarsVisualizer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.peaks = [];
    this.peakDots = []; // Array to store peak dots
  }

  /**
   * Draw frequency bars visualization
   * @param {Uint8Array} dataArray - Audio frequency data
   * @param {string} colorScheme - Color scheme to use
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   * @param {number} decayMs - Peak decay time in milliseconds
   * @param {number} barCount - Number of bars to display
   */
  draw(dataArray, colorScheme, deltaTime, decayMs, barCount) {
    const width = this.canvas.width;
    const height = this.canvas.height;

    const barWidth = width / barCount;

    // Initialize peaks array if needed
    if (!this.peaks.length || this.peaks.length !== barCount) {
      this.peaks = Array(barCount).fill(0);
      this.peakDots = Array(barCount).fill(null);
    }

    // Decay rate based on user setting
    const decayRate = deltaTime / decayMs;

    // Calculate frequency bins using the same distribution as the circle visualizer
    const frequencyBins = this.calculateFrequencyBins(
      dataArray.length,
      barCount,
    );

    for (let i = 0; i < barCount; i++) {
      const binRange = frequencyBins[i];
      const startBin = binRange.start;
      const endBin = binRange.end;

      // Get average value for this frequency band
      let sum = 0;
      let count = 0;

      for (let j = startBin; j <= endBin; j++) {
        if (j < dataArray.length) {
          sum += dataArray[j];
          count++;
        }
      }

      const value = count > 0 ? sum / count : 0;

      // Calculate bar height based on frequency value (0-255)
      const barHeight = (value / 255) * height;
      const x = i * barWidth;
      const y = height - barHeight;

      // Set color based on selected scheme
      this.ctx.fillStyle = ColorUtils.getColor(value, i, barCount, colorScheme);

      // Draw bar with rounded corners
      this.ctx.beginPath();
      const radius = barWidth / 4;

      // Only round the top corners
      this.ctx.moveTo(x, height);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.lineTo(x + barWidth - radius, y);
      this.ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      this.ctx.lineTo(x + barWidth, height);
      this.ctx.closePath();

      this.ctx.fill();

      // Check for new peak
      if (value > this.peaks[i]) {
        this.peaks[i] = value;

        // Create a new peak dot
        const peakBarHeight = (value / 255) * height;
        const peakY = height - peakBarHeight;
        const centerX = x + barWidth / 2;

        this.peakDots[i] = {
          x: centerX,
          y: peakY,
          createdAt: performance.now(),
          value: value,
        };
      }

      // Decay the peaks over time
      this.peaks[i] = Math.max(0, this.peaks[i] - 255 * decayRate);

      // If peak decayed to 0, remove the dot
      if (this.peaks[i] === 0) {
        this.peakDots[i] = null;
      }
    }

    // Draw all peak dots
    this.drawPeakDots(decayMs);
  }

  /**
   * Calculate frequency bins using the same approach as the circular visualizer
   * @param {number} dataLength - Length of data array
   * @param {number} barCount - Number of bars
   * @returns {Array} Array of bin ranges
   */
  calculateFrequencyBins(dataLength, barCount) {
    const bins = [];
    const maxFreqIndex = Math.min(dataLength, 512); // Limit to lower half of frequency range

    for (let i = 0; i < barCount; i++) {
      let startBin, endBin;

      // Match the circle visualizer's hybrid approach:
      // First 20% of bars - linear distribution for very low frequencies
      // Remaining 80% - logarithmic/power distribution
      if (i < barCount * 0.2) {
        // Linear distribution for first 20% of bars (lowest frequencies)
        startBin = Math.floor((i / (barCount * 0.2)) * (maxFreqIndex * 0.1));
        endBin = Math.floor(
          ((i + 1) / (barCount * 0.2)) * (maxFreqIndex * 0.1),
        );
      } else {
        // Logarithmic distribution for remaining 80% of bars
        startBin = Math.floor(
          maxFreqIndex * 0.1 +
            Math.pow((i - barCount * 0.2) / (barCount * 0.8), 2) *
              (maxFreqIndex * 0.9),
        );
        endBin = Math.floor(
          maxFreqIndex * 0.1 +
            Math.pow((i + 1 - barCount * 0.2) / (barCount * 0.8), 2) *
              (maxFreqIndex * 0.9),
        );
      }

      bins.push({
        start: startBin,
        end: endBin,
      });
    }

    return bins;
  }

  /**
   * Draw all peak dots with opacity based on time elapsed
   * @param {number} decayMs - Peak decay time in milliseconds
   */
  drawPeakDots(decayMs) {
    const currentTime = performance.now();

    for (let i = 0; i < this.peakDots.length; i++) {
      const dot = this.peakDots[i];
      if (!dot) continue;

      // Calculate opacity based on time elapsed since creation
      const timeSincePeak = currentTime - dot.createdAt;
      const normalizedTime = Math.min(timeSincePeak / decayMs, 1);
      const opacity = 1 - normalizedTime;

      if (opacity > 0) {
        // Draw the peak dot
        const dotRadius = this.canvas.width / this.peakDots.length / 3;
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.fill();
      }
    }
  }
}
