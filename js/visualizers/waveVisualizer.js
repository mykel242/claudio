/**
 * Waveform visualizer
 */
class WaveVisualizer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    /**
     * Draw waveform visualization
     * @param {Uint8Array} timeDataArray - Audio time domain data
     * @param {string} colorScheme - Color scheme to use
     */
    draw(timeDataArray, colorScheme) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const bufferLength = timeDataArray.length;
        const sliceWidth = width / bufferLength;
        
        this.ctx.lineWidth = 2;
        
        // Set color based on selected scheme
        this.ctx.strokeStyle = ColorUtils.getWaveformColor(this.ctx, width, colorScheme);
        
        this.ctx.beginPath();
        
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = timeDataArray[i] / 128.0;
            const y = v * height / 2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.ctx.stroke();
    }
}