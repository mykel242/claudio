/**
 * Frequency bars visualizer with distribution matching circular visualizer
 * Peaks functionality disabled
 */
class BarsVisualizer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /**
   * Draw frequency bars visualization
   * @param {Uint8Array} dataArray - Audio frequency data
   * @param {string} colorScheme - Color scheme to use
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   * @param {number} decayMs - Peak decay time in milliseconds (unused)
   * @param {number} barCount - Number of bars to display
   */
  draw(dataArray, colorScheme, deltaTime, decayMs, barCount) {
    const width = this.canvas.width;
    const height = this.canvas.height;

    const barWidth = width / barCount;

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
    }
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
}
