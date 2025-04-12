/**
 * Controls audio input, processing, and analysis
 */
class AudioController {
    constructor(statusElement) {
        this.statusElement = statusElement;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.audioElement = null;
        this.isPlaying = false;
    }

    /**
     * Initialize the audio context and analyzer
     */
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            // Configure analyser
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.85;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.analyser.connect(this.audioContext.destination);
        }
    }

    /**
     * Use microphone input
     * @returns {Promise<boolean>} Success status
     */
    async useMicrophone() {
        try {
            this.initAudio();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.statusElement.textContent = 'Using microphone input...';
            
            if (this.source) {
                this.source.disconnect();
            }
            
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.analyser);
            
            this.isPlaying = true;
            return true;
            
        } catch (err) {
            this.statusElement.textContent = 'Error accessing microphone: ' + err.message;
            console.error('Error accessing microphone:', err);
            return false;
        }
    }

    /**
     * Play an audio file
     * @param {File} file - The audio file to play
     * @returns {Promise<boolean>} Success status
     */
    playAudioFile(file) {
        return new Promise((resolve) => {
            if (!file) {
                this.statusElement.textContent = 'Please select an audio file first.';
                resolve(false);
                return;
            }
            
            this.initAudio();
            
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.remove();
            }
            
            this.audioElement = new Audio();
            this.audioElement.src = URL.createObjectURL(file);
            
            this.audioElement.oncanplay = () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                if (this.source) {
                    this.source.disconnect();
                }
                
                this.source = this.audioContext.createMediaElementSource(this.audioElement);
                this.source.connect(this.analyser);
                
                this.audioElement.play();
                
                this.isPlaying = true;
                this.statusElement.textContent = 'Playing: ' + file.name;
                
                resolve(true);
            };
            
            this.audioElement.onerror = () => {
                this.statusElement.textContent = 'Error playing the audio file.';
                resolve(false);
            };
        });
    }

    /**
     * Stop audio playback/capture
     */
    stopAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        
        this.isPlaying = false;
        this.statusElement.textContent = 'Stopped. Ready to start again.';
    }

    /**
     * Get the current frequency data
     * @returns {Uint8Array} Audio frequency data
     */
    getFrequencyData() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }

    /**
     * Get the current time domain data (waveform)
     * @returns {Uint8Array} Audio time domain data
     */
    getTimeData() {
        const timeDataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(timeDataArray);
        return timeDataArray;
    }
}