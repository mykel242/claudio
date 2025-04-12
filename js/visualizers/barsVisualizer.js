/**
 * Frequency bars visualizer
 */
class BarsVisualizer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.peaks = [];
        this.lastUpdateTime = 0;
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
        const step = Math.floor(dataArray.length / barCount);
        
        // Initialize peaks array if needed
        if (!this.peaks.length || this.peaks.length !== barCount) {
            this.peaks = Array(barCount).fill().map(() => ({ value: 0, time: 0 }));
        }
        
        // Decay rate based on user setting
        const decayRate = deltaTime / decayMs;
        
        for (let i = 0; i < barCount; i++) {
            // Get average value for this frequency band
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            const value = sum / step;
            
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
            
            // Update peak if current value is higher
            if (value > this.peaks[i].value) {
                this.peaks[i] = { value: value, time: performance.now() };
            }
            
            // Draw the peak dot - now separated from the bar
            const peakBarHeight = (this.peaks[i].value / 255) * height;
            const peakY = height - peakBarHeight;
            const centerX = x + barWidth / 2;
            
            // Calculate opacity based on time elapsed since last peak
            const timeSincePeak = performance.now() - this.peaks[i].time;
            const normalizedTime = Math.min(timeSincePeak / decayMs, 1);
            const opacity = 1 - normalizedTime;
            
            if (opacity > 0) {
                // Draw the peak dot
                const dotRadius = barWidth / 3;
                this.ctx.beginPath();
                this.ctx.arc(centerX, peakY, dotRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                this.ctx.fill();
            }
            
            // Decay the peak over time
            this.peaks[i].value = Math.max(0, this.peaks[i].value - (255 * decayRate));
        }
    }
}