/**
 * Circular visualizer
 */
class CircleVisualizer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.peaks = [];
    this.peakDots = []; // Store peak dots
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
    const halfCount = Math.floor(barCount / 2);

    // Initialize arrays if needed
    if (!this.peaks.length || this.peaks.length !== barCount + 1) {
      this.peaks = Array(barCount + 1).fill(0);
      this.peakDots = Array(barCount + 1).fill(null);
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
      halfCount,
      halfCount,
      -1,
      maxBarLength,
    );

    // Fill the gap at PI/2 with an extra bar
    this._drawExtraBar(
      dataArray,
      colorScheme,
      decayMs,
      decayRate,
      centerX,
      centerY,
      innerRadius,
      halfCount,
      Math.PI / 2,
      maxBarLength,
    );

    // Draw all peak dots
    this.drawPeakDots(centerX, centerY, innerRadius, maxBarLength, decayMs);
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
    halfCount,
    indexOffset,
    direction,
    maxBarLength,
  ) {
    // Focus on lower frequencies by using logarithmic scaling
    const maxFreqIndex = Math.min(dataArray.length, 512); // Limit to lower half of frequency range

    for (let i = 0; i < halfCount; i++) {
      // Calculate frequency index using logarithmic scale to emphasize lower frequencies
      let freqIndex, nextFreqIndex;
      if (i < halfCount * 0.2) {
        // First 20% of bars - linear distribution
        freqIndex = Math.floor((i / (halfCount * 0.2)) * (maxFreqIndex * 0.1));
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

      // Calculate bar height based on frequency value with max length constraint
      const maxHeight = innerRadius * (maxBarLength / 100);
      const barHeight = (value / 255) * maxHeight;

      // Calculate angle for this bar
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
      if (value > this.peaks[peakIndex]) {
        // Store new peak value
        this.peaks[peakIndex] = value;

        // Create a new peak dot
        this.peakDots[peakIndex] = {
          angle: angle,
          value: value,
          createdAt: performance.now(),
        };
      }

      // Decay the peak over time
      this.peaks[peakIndex] = Math.max(
        0,
        this.peaks[peakIndex] - 255 * decayRate,
      );

      // If peak decayed to 0, remove the dot
      if (this.peaks[peakIndex] === 0) {
        this.peakDots[peakIndex] = null;
      }
    }
  }

  /**
   * Draw an extra bar at a specific angle to fill the gap
   * @param {Uint8Array} dataArray - Audio frequency data
   * @param {string} colorScheme - Color scheme to use
   * @param {number} decayMs - Peak decay time in milliseconds
   * @param {number} decayRate - Rate of peak decay
   * @param {number} centerX - X coordinate of the center
   * @param {number} centerY - Y coordinate of the center
   * @param {number} innerRadius - Base radius of the inner circle
   * @param {number} halfCount - Half the number of total segments
   * @param {number} angle - The specific angle for this bar
   * @param {number} maxBarLength - Maximum bar length as percentage of inner radius
   */
  _drawExtraBar(
    dataArray,
    colorScheme,
    decayMs,
    decayRate,
    centerX,
    centerY,
    innerRadius,
    halfCount,
    angle,
    maxBarLength,
  ) {
    // Use an average of nearby frequencies
    const freqIndex = Math.floor(dataArray.length / 2);
    const bandSize = 10;

    let sum = 0;
    for (let j = 0; j < bandSize; j++) {
      const index = freqIndex + j;
      if (index < dataArray.length) {
        sum += dataArray[index];
      }
    }
    const value = sum / bandSize;

    // Calculate bar height with max length constraint
    const maxHeight = innerRadius * (maxBarLength / 100);
    const barHeight = (value / 255) * maxHeight;

    // Calculate start and end points
    const innerX = centerX + Math.cos(angle) * innerRadius;
    const innerY = centerY + Math.sin(angle) * innerRadius;

    const outerX = centerX + Math.cos(angle) * (innerRadius + barHeight);
    const outerY = centerY + Math.sin(angle) * (innerRadius + barHeight);

    // Set color based on scheme
    const peakIndex = halfCount * 2; // Use the last position in the peaks array
    this.ctx.strokeStyle = ColorUtils.getColor(
      value,
      peakIndex,
      halfCount * 2 + 1,
      colorScheme,
    );
    this.ctx.lineWidth = 2;

    // Draw line from inner circle to outer point
    this.ctx.beginPath();
    this.ctx.moveTo(innerX, innerY);
    this.ctx.lineTo(outerX, outerY);
    this.ctx.stroke();

    // Update peak if current value is higher
    if (value > this.peaks[peakIndex]) {
      // Store new peak value
      this.peaks[peakIndex] = value;

      // Create a new peak dot
      this.peakDots[peakIndex] = {
        angle: angle,
        value: value,
        createdAt: performance.now(),
      };
    }

    // Decay the peak over time
    this.peaks[peakIndex] = Math.max(
      0,
      this.peaks[peakIndex] - 255 * decayRate,
    );

    // If peak decayed to 0, remove the dot
    if (this.peaks[peakIndex] === 0) {
      this.peakDots[peakIndex] = null;
    }
  }

  /**
   * Draw all peak dots with opacity based on time elapsed
   * @param {number} centerX - X coordinate of the center
   * @param {number} centerY - Y coordinate of the center
   * @param {number} innerRadius - Base radius of the inner circle
   * @param {number} maxBarLength - Maximum bar length as percentage
   * @param {number} decayMs - Peak decay time in milliseconds
   */
  drawPeakDots(centerX, centerY, innerRadius, maxBarLength, decayMs) {
    const currentTime = performance.now();

    for (let i = 0; i < this.peakDots.length; i++) {
      const dot = this.peakDots[i];
      if (!dot) continue;

      // Calculate opacity based on time elapsed since creation
      const timeSincePeak = currentTime - dot.createdAt;
      const normalizedTime = Math.min(timeSincePeak / decayMs, 1);
      const opacity = 1 - normalizedTime;

      if (opacity > 0) {
        // Calculate the peak dot position
        const maxHeight = innerRadius * (maxBarLength / 100);
        const peakBarHeight = (dot.value / 255) * maxHeight;

        const peakX =
          centerX + Math.cos(dot.angle) * (innerRadius + peakBarHeight);
        const peakY =
          centerY + Math.sin(dot.angle) * (innerRadius + peakBarHeight);

        // Draw the peak dot
        this.ctx.beginPath();
        this.ctx.arc(peakX, peakY, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.fill();
      }
    }
  }
}
