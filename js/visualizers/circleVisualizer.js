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
     */
    draw(dataArray, colorScheme, deltaTime, decayMs, barCount) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const radius = Math.min(width, height) / 3;
        const step = Math.floor(dataArray.length / barCount);
        const halfCount = Math.floor(barCount / 2);
        
        // Initialize peaks array if needed for circular visualization
        if (!this.peaks.length || this.peaks.length !== barCount) {
            this.peaks = Array(barCount).fill().map(() => ({ value: 0, time: 0 }));
        }
        
        // Decay rate based on user setting
        const decayRate = deltaTime / decayMs;
        
        // Draw base circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.stroke();
        
        // Draw the upper half (0 to PI)
        this._drawHalfCircle(dataArray, colorScheme, decayMs, decayRate, centerX, centerY, radius, step, halfCount, 0, 1);
        
        // Draw the lower half (0 to -PI)
        this._drawHalfCircle(dataArray, colorScheme, decayMs, decayRate, centerX, centerY, radius, step, halfCount, halfCount, -1);
    }

    /**
     * Draw half of the circular visualization
     * @param {Uint8Array} dataArray - Audio frequency data
     * @param {string} colorScheme - Color scheme to use
     * @param {number} decayMs - Peak decay time in milliseconds
     * @param {number} decayRate - Rate of peak decay
     * @param {number} centerX - X coordinate of the center
     * @param {number} centerY - Y coordinate of the center
     * @param {number} radius - Base radius of the circle
     * @param {number} step - Frequency steps per segment
     * @param {number} halfCount - Half the number of total segments
     * @param {number} indexOffset - Starting index offset
     * @param {number} direction - Direction multiplier (1 or -1)
     */
    _drawHalfCircle(dataArray, colorScheme, decayMs, decayRate, centerX, centerY, radius, step, halfCount, indexOffset, direction) {
        for (let i = 0; i < halfCount; i++) {
            // Get average value for this frequency band
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            const value = sum / step;
            
            // Calculate bar height based on frequency value (0-255)
            const barHeight = (value / 255) * radius;
            
            // Calculate angle for this bar - map from 0 to PI * direction
            const angle = direction * (i / halfCount) * Math.PI;
            
            // Calculate start and end points
            const innerX = centerX + Math.cos(angle) * radius;
            const innerY = centerY + Math.sin(angle) * radius;
            
            const outerX = centerX + Math.cos(angle) * (radius + barHeight);
            const outerY = centerY + Math.sin(angle) * (radius + barHeight);
            
            // Set color based on scheme
            const peakIndex = i + indexOffset;
            this.ctx.strokeStyle = ColorUtils.getColor(value, peakIndex, halfCount * 2, colorScheme);
            this.ctx.lineWidth = 2;
            
            // Draw line from inner circle to outer point
            this.ctx.beginPath();
            this.ctx.moveTo(innerX, innerY);
            this.ctx.lineTo(outerX, outerY);
            this.ctx.stroke();
            
            // Update peak if current value is higher
            if (value > this.peaks[peakIndex].value) {
                this.peaks[peakIndex] = { value: value, time: performance.now() };
            }
            
            // Draw peak dot with fade effect
            const peakBarHeight = (this.peaks[peakIndex].value / 255) * radius;
            const peakX = centerX + Math.cos(angle) * (radius + peakBarHeight);
            const peakY = centerY + Math.sin(angle) * (radius + peakBarHeight);
            
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
            
            // Decay the peak over time
            this.peaks[peakIndex].value = Math.max(0, this.peaks[peakIndex].value - (255 * decayRate));
        }
    }
}