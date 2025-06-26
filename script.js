class TapMetronome {
    constructor() {
        this.bpm = 120;
        this.isPlaying = false;
        this.intervalId = null;
        this.audioContext = null;
        this.volume = 0.7;
        
        this.tapTimes = [];
        this.maxTapHistory = 8;
        
        this.initializeAudio();
        this.initializeElements();
        this.bindEvents();
        this.updateVolumeIndicators();
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Web Audio API not supported:', error);
        }
    }
    
    initializeElements() {
        this.bpmDisplay = document.getElementById('bpmValue');
        this.beatLight = document.getElementById('beatLight');
        this.tapBtn = document.getElementById('tapBtn');
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.tempoUpBtn = document.getElementById('tempoUp');
        this.tempoDownBtn = document.getElementById('tempoDown');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeLights = [
            document.getElementById('vol1'),
            document.getElementById('vol2'),
            document.getElementById('vol3'),
            document.getElementById('vol4'),
            document.getElementById('vol5')
        ];
    }
    
    bindEvents() {
        this.tapBtn.addEventListener('click', () => this.handleTap());
        this.playBtn.addEventListener('click', () => this.play());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.tempoUpBtn.addEventListener('click', () => this.changeTempo(1));
        this.tempoDownBtn.addEventListener('click', () => this.changeTempo(-1));
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleTap();
            }
        });
    }
    
    handleTap() {
        const now = Date.now();
        this.tapTimes.push(now);
        
        if (this.tapTimes.length > this.maxTapHistory) {
            this.tapTimes.shift();
        }
        
        if (this.tapTimes.length >= 2) {
            this.calculateBPMFromTaps();
        }
        
        this.flashTapButton();
        this.playClick();
    }
    
    calculateBPMFromTaps() {
        if (this.tapTimes.length < 2) return;
        
        const intervals = [];
        for (let i = 1; i < this.tapTimes.length; i++) {
            intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
        }
        
        if (intervals.length === 0) return;
        
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const newBPM = Math.round(60000 / avgInterval);
        
        if (newBPM >= 40 && newBPM <= 200) {
            this.setBPM(newBPM);
        }
    }
    
    flashTapButton() {
        this.tapBtn.style.transform = 'scale(0.95)';
        this.tapBtn.style.boxShadow = '0 2px 10px rgba(255, 107, 53, 0.8)';
        
        setTimeout(() => {
            this.tapBtn.style.transform = 'scale(1)';
            this.tapBtn.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)';
        }, 100);
    }
    
    setBPM(newBPM) {
        this.bpm = Math.max(40, Math.min(200, newBPM));
        this.bpmDisplay.textContent = this.bpm;
        
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }
    
    changeTempo(direction) {
        const newBPM = this.bpm + direction;
        this.setBPM(newBPM);
    }
    
    play() {
        if (this.isPlaying) return;
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.playBtn.style.background = 'linear-gradient(145deg, #33ff99, #00ff88)';
        
        const interval = 60000 / this.bpm;
        
        this.tick();
        this.intervalId = setInterval(() => {
            this.tick();
        }, interval);
    }
    
    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        this.playBtn.style.background = 'linear-gradient(145deg, #00ff88, #00cc6a)';
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.beatLight.classList.remove('active');
    }
    
    tick() {
        this.playClick();
        this.flashBeatLight();
    }
    
    playClick() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    flashBeatLight() {
        this.beatLight.classList.add('active');
        setTimeout(() => {
            this.beatLight.classList.remove('active');
        }, 100);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.updateVolumeIndicators();
    }
    
    updateVolumeIndicators() {
        const activeCount = Math.ceil(this.volume * 5);
        
        this.volumeLights.forEach((light, index) => {
            if (index < activeCount) {
                light.classList.add('active');
            } else {
                light.classList.remove('active');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const metronome = new TapMetronome();
    
    document.addEventListener('click', () => {
        if (metronome.audioContext && metronome.audioContext.state === 'suspended') {
            metronome.audioContext.resume();
        }
    }, { once: true });
});