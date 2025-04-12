/**
 * Color utilities for the visualizers
 */
class ColorUtils {
    /**
     * Get color based on scheme and value
     * @param {number} value - The audio data value (0-255)
     * @param {number} i - The current bar/segment index
     * @param {number} totalItems - Total number of bars/segments
     * @param {string} colorScheme - The selected color scheme
     * @returns {string} - CSS color string
     */
    static getColor(value, i, totalItems, colorScheme) {
        switch (colorScheme) {
            case 'rainbow':
                const hue = (i / totalItems) * 360;
                return `hsl(${hue}, 100%, 50%)`;
            case 'gradient':
                const intensity = value / 255;
                return `rgb(${Math.round(intensity * 255)}, ${Math.round(intensity * 100)}, ${Math.round(255 - intensity * 255)})`;
            case 'single':
                return '#4CAF50';
            case 'white-fade':
                const alphaWhite = 0.1 + (value / 255) * 0.9;
                return `rgba(255, 255, 255, ${alphaWhite})`;
            case 'blue-fade':
                const alphaBlue = 0.1 + (value / 255) * 0.9;
                return `rgba(0, 100, 255, ${alphaBlue})`;
            case 'green-fade':
                const alphaGreen = 0.1 + (value / 255) * 0.9;
                return `rgba(0, 220, 100, ${alphaGreen})`;
            case 'purple-fade':
                const alphaPurple = 0.1 + (value / 255) * 0.9;
                return `rgba(180, 0, 255, ${alphaPurple})`;
            case 'cyan-fade':
                const alphaCyan = 0.1 + (value / 255) * 0.9;
                return `rgba(0, 220, 220, ${alphaCyan})`;
            default:
                return '#4CAF50';
        }
    }

    /**
     * Create a gradient for waveform visualization
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {string} colorScheme - The selected color scheme
     * @returns {string|CanvasGradient} - CSS color string or canvas gradient
     */
    static getWaveformColor(ctx, width, colorScheme) {
        if (colorScheme === 'rainbow') {
            return 'hsl(180, 100%, 50%)';
        } else if (colorScheme === 'gradient') {
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, 'rgb(0, 255, 255)');
            gradient.addColorStop(0.5, 'rgb(255, 0, 255)');
            gradient.addColorStop(1, 'rgb(255, 255, 0)');
            return gradient;
        } else {
            return ColorUtils.getColor(200, 0, 1, colorScheme);
        }
    }
}