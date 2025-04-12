/**
 * Circular visualizer
 */
class CircleVisualizer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.peaks = [];
  }

  /**
   * Draw circular visualization
   * @param {Uint8Array} dataArray - Audio frequency data
   * @param {string} colorScheme - Color scheme to use
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   * @param {number} decayMs - Peak decay time in milliseconds
   * @param {number} barCount - Number of segments to display
   * @param {number} innerRadiusFactor - Factor to control inner circle radius (default: 4)
   * @param {number} maxBarLength - Maximum length for bars as percentage of inner radius (default: 100)
   */
  draw(
    dataArray,
    colorScheme,
    deltaTime,
    decayMs,
    barCount,
    innerRadiusFactor = 4,
    maxBarLength = 100,
  ) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate inner radius based on factor
    const innerRadius = Math.min(width, height) / innerRadiusFactor;
    const step = Math.floor(dataArray.length / barCount);
    const halfCount = Math.floor(barCount / 2);

    // Initialize peaks array if needed for circular visualization
    if (!this.peaks.length || this.peaks.length !== barCount) {
      this.peaks = Array(barCount)
        .fill()
        .map(() => ({ value: 0, time: 0 }));
    }

    // Decay rate based on user setting
    const decayRate = deltaTime / decayMs;

    // Draw base circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    this.ctx.stroke();

    // Draw the upper half (-PI/2 to PI/2)
    this._drawHalfCircle(
      dataArray,
      colorScheme,
      decayMs,
      decayRate,
      centerX,
      centerY,
      innerRadius,
      step,
      halfCount,
      0,
      1,
      maxBarLength,
    );

    // Draw the lower half (-PI/2 to -PI - PI/2)
    this._drawHalfCircle(
      dataArray,
      colorScheme,
      decayMs,
      decayRate,
      centerX,
      centerY,
      innerRadius,
      step,
      halfCount,
      halfCount,
      -1,
      maxBarLength,
    );
  }

  /**
   * Draw half of the circular visualization
   * @param {Uint8Array} dataArray - Audio frequency data
   * @param {string} colorScheme - Color scheme to use
   * @param {number} decayMs - Peak decay time in milliseconds
   * @param {number} decayRate - Rate of peak decay
   * @param {number} centerX - X coordinate of the center
   * @param {number} centerY - Y coordinate of the center
   * @param {number} innerRadius - Base radius of the inner circle
   * @param {number} step - Frequency steps per segment
   * @param {number} halfCount - Half the number of total segments
   * @param {number} indexOffset - Starting index offset
   * @param {number} direction - Direction multiplier (1 or -1)
   * @param {number} maxBarLength - Maximum bar length as percentage of inner radius
   */
  _drawHalfCircle(
    dataArray,
    colorScheme,
    decayMs,
    decayRate,
    centerX,
    centerY,
    innerRadius,
    step,
    halfCount,
    indexOffset,
    direction,
    maxBarLength,
  ) {
    // Focus on lower frequencies by using logarithmic scaling
    const maxFreqIndex = Math.min(dataArray.length, 512); // Limit to lower half of frequency range

    for (let i = 0; i < halfCount; i++) {
      // Calculate frequency index using logarithmic scale to emphasize lower frequencies
      // Use a more gradual curve for very low frequencies to avoid bunching
      let freqIndex, nextFreqIndex;
      if (i < halfCount * 0.2) {
        // First 20% of bars - linear distribution
        freqIndex = Math.floor((i / (halfCount * 0.2)) * (maxFreqIndex * 0.1)); // First 10% of frequency range
        nextFreqIndex = Math.floor(
          ((i + 1) / (halfCount * 0.2)) * (maxFreqIndex * 0.1),
        );
      } else {
        // Remaining bars - logarithmic distribution
        freqIndex = Math.floor(
          maxFreqIndex * 0.1 +
            Math.pow((i - halfCount * 0.2) / (halfCount * 0.8), 2) *
              (maxFreqIndex * 0.9),
        );
        nextFreqIndex = Math.floor(
          maxFreqIndex * 0.1 +
            Math.pow((i + 1 - halfCount * 0.2) / (halfCount * 0.8), 2) *
              (maxFreqIndex * 0.9),
        );
      }
      const bandSize = Math.max(1, nextFreqIndex - freqIndex);

      // Get average value for this frequency band
      let sum = 0;
      for (let j = 0; j < bandSize; j++) {
        const index = freqIndex + j;
        if (index < dataArray.length) {
          sum += dataArray[index];
        }
      }
      const value = sum / bandSize;

      // Calculate bar height based on frequency value (0-255) with max length constraint
      const maxHeight = innerRadius * (maxBarLength / 100);
      const barHeight = (value / 255) * maxHeight;

      // Calculate angle for this bar - map from -PI/2 to -PI/2 + PI * direction
      const angle = -Math.PI / 2 + direction * (i / halfCount) * Math.PI;

      // Calculate start and end points
      const innerX = centerX + Math.cos(angle) * innerRadius;
      const innerY = centerY + Math.sin(angle) * innerRadius;

      const outerX = centerX + Math.cos(angle) * (innerRadius + barHeight);
      const outerY = centerY + Math.sin(angle) * (innerRadius + barHeight);

      // Set color based on scheme
      const peakIndex = i + indexOffset;
      this.ctx.strokeStyle = ColorUtils.getColor(
        value,
        peakIndex,
        halfCount * 2,
        colorScheme,
      );
      this.ctx.lineWidth = 2;

      // Draw line from inner circle to outer point
      this.ctx.beginPath();
      this.ctx.moveTo(innerX, innerY);
      this.ctx.lineTo(outerX, outerY);
      this.ctx.stroke();

      // Update peak if current value is higher
      if (value > this.peaks[peakIndex].value) {
        this.peaks[peakIndex] = { value: value, time: performance.now() };
      } else {
        // Only decay the peak over time if we're not setting a new peak
        this.peaks[peakIndex].value = Math.max(
          0,
          this.peaks[peakIndex].value - 255 * decayRate,
        );
      }

      // Draw peak dot with fade effect (only if we have a peak that hasn't fully decayed)
      if (this.peaks[peakIndex].value > 0) {
        // Calculate peak bar height with max constraint
        const maxHeight = innerRadius * (maxBarLength / 100);
        const peakBarHeight = (this.peaks[peakIndex].value / 255) * maxHeight;

        const peakX = centerX + Math.cos(angle) * (innerRadius + peakBarHeight);
        const peakY = centerY + Math.sin(angle) * (innerRadius + peakBarHeight);

        // Calculate opacity based on time elapsed
        const timeSincePeak = performance.now() - this.peaks[peakIndex].time;
        const normalizedTime = Math.min(timeSincePeak / decayMs, 1);
        const opacity = 1 - normalizedTime;

        if (opacity > 0) {
          this.ctx.beginPath();
          this.ctx.arc(peakX, peakY, 3, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          this.ctx.fill();
        }
      }
    }
  }
}
