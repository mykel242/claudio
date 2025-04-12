/**
 * Utility functions for the audio visualizer
 */
class Utils {
    /**
     * Resizes the canvas to match client dimensions with higher resolution
     * @param {HTMLCanvasElement} canvas - The canvas element to resize
     */
    static resizeCanvas(canvas) {
        canvas.width = canvas.clientWidth * 2;
        canvas.height = canvas.clientHeight * 2;
    }

    /**
     * Sets up event listener for window resize to keep canvas correctly sized
     * @param {HTMLCanvasElement} canvas - The canvas element to resize on window events
     */
    static setupCanvasResizing(canvas) {
        Utils.resizeCanvas(canvas);
        window.addEventListener('resize', () => Utils.resizeCanvas(canvas));
    }

    /**
     * Updates UI element text content
     * @param {string} elementId - The ID of the element to update
     * @param {string} text - The text content to set
     */
    static updateElement(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Updates button states based on playback status
     * @param {boolean} isPlaying - Whether audio is currently playing
     * @param {HTMLElement} micButton - The microphone button element
     * @param {HTMLElement} stopButton - The stop button element
     * @param {HTMLElement} playFileButton - The play file button element
     * @param {HTMLInputElement} audioFileInput - The audio file input element
     */
    static updateButtonStates(isPlaying, micButton, stopButton, playFileButton, audioFileInput) {
        stopButton.disabled = !isPlaying;
        micButton.disabled = isPlaying;
        playFileButton.disabled = isPlaying || audioFileInput.files.length === 0;
    }
}