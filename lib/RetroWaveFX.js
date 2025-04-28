window.RetroWaveFX = window.RetroWaveFX || {};

RetroWaveFX.Audio = {
    audioCtx: null,
    isInitialized: false, // Flag to track initialization
    soundEffects: {}, // Registry for sound effects

    // Initialize or resume AudioContext (must be called after user interaction)
    initAudio() {
        // Prevent multiple initializations or handle existing context
        if (this.audioCtx) {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(e => console.error("Error resuming AudioContext:", e));
            }
            return; // Already initialized or attempting resume
        }
        // Only set isInitialized flag *after* successful creation or if already exists
        if (this.isInitialized) return; 

        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log("AudioContext created.");
            this.isInitialized = true; // Set flag only on successful creation

            if (this.audioCtx.state === 'suspended') {
                console.log("AudioContext is suspended. It will attempt to resume on the first sound playback triggered by user interaction.");
                // No automatic resume here; let _ensureContextReady handle it during playback
            }
        } catch (e) {
            console.error("Web Audio API is not supported in this browser", e);
            this.isInitialized = false;
        }
    },

    // Internal helper to ensure context is ready and resumed
    async _ensureContextReady() { // Make it async to handle resume promise
        if (!this.audioCtx) {
             console.warn("AudioContext not initialized. Call initAudio() first, ideally from a user interaction handler.");
             // Attempt init, but it might fail if not triggered by user interaction & audioCtx will remain null
             this.initAudio();
             if (!this.audioCtx) return false; // Still not initialized
        }

        if (this.audioCtx.state === 'suspended') {
           try {
               await this.audioCtx.resume();
               console.log("AudioContext resumed successfully.");
               return true;
           } catch (e) {
               console.error("Error resuming AudioContext. User interaction might be required.", e);
               return false;
           }
        }
        return true; // Context is already running
    },

    // Register a new sound effect
    registerSound(name, metadata, playFunc) {
        if (!this.audioCtx && !this.isInitialized) {
             // Try to initialize implicitly, mainly for non-interactive setup
             // But actual playback readiness depends on _ensureContextReady later
             this.initAudio();
        }
        this.soundEffects[name] = {
            name: name,
            description: metadata.description || 'No description',
            emoji: metadata.emoji || '🔊',
            category: metadata.category || 'Uncategorized', // Added category
            play: playFunc, // The actual function to generate the sound
            play: playFunc // The actual function to generate the sound
        };
        console.log(`Sound registered: ${metadata.emoji} ${name}`);
    },

    // Get metadata for all registered sounds
    getAllSoundEffects() {
        // Return a copy of the metadata part, excluding the play function itself for the UI
        return Object.values(this.soundEffects).map(sound => ({
            name: sound.name,
            description: sound.description,
            emoji: sound.emoji,
            category: sound.category // Added category
        }));
    },

    // Play a sound by its registered name
    async playSoundByName(name) {
        const sound = this.soundEffects[name];
        if (!sound) {
            console.error(`Sound "${name}" not found.`);
            return;
        }

        const ready = await this._ensureContextReady(); // Wait for context readiness
        if (!ready) {
            console.warn(`AudioContext not ready for sound: ${name}. Needs user interaction?`);
            return;
        }

        try {
            // Call the specific play function stored in the registry
            sound.play(this.audioCtx);
        } catch (e) {
            console.error(`Error playing sound "${name}":`, e);
        }
    },

    // --- Sound Effect Definitions ---
    _registerDefaultSounds() {
        // Correct Sound Implementation
        this.registerSound('correct', {
            description: 'Short, rising sound for correct actions or confirmations.',
            emoji: '✅',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'square';
            const freq1 = 1046.50; // C6
            const freq2 = 1396.91; // F6
            const now = audioCtx.currentTime;
            const switchTime = 0.04;
            const duration = 0.1;

            oscillator.frequency.setValueAtTime(freq1, now);
            oscillator.frequency.linearRampToValueAtTime(freq2, now + switchTime);
            const peakVolume = 0.25;
            gainNode.gain.setValueAtTime(peakVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        });

        // Error Sound Implementation
        this.registerSound('error', {
            description: 'Descending pitch sound for errors or incorrect actions.',
            emoji: '❌',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sawtooth';
            const startFrequency = 164.81; // E3
            const endFrequency = 110.00;   // A2
            const now = audioCtx.currentTime;
            const pitchBendDuration = 0.15;
            const duration = 0.25;

            oscillator.frequency.setValueAtTime(startFrequency, now);
            oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + pitchBendDuration);
            const peakVolume = 0.3;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(peakVolume, now + duration * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        });

        // --- Add more sounds here ---
        // Example: Laser Shoot
        this.registerSound('laserShoot', {
            description: 'Classic quick laser pew sound.',
            emoji: '💥',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'square';
            const startFreq = 880; // A5
            const endFreq = 220; // A3
            const now = audioCtx.currentTime;
            const duration = 0.08;

            oscillator.frequency.setValueAtTime(startFreq, now);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

            const peakVolume = 0.2;
            gainNode.gain.setValueAtTime(peakVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        });

        // Example: Coin Pickup
         this.registerSound('coinPickup', {
            description: 'Bright, short sound for collecting items.',
            emoji: '💰',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'triangle'; // Softer tone
            const freq1 = 1567.98; // G6
            const freq2 = 2093.00; // C7
            const now = audioCtx.currentTime;
            const duration = 0.07;

            oscillator.frequency.setValueAtTime(freq1, now);
            oscillator.frequency.linearRampToValueAtTime(freq2, now + duration * 0.6); // Quick rise

            const peakVolume = 0.3;
            gainNode.gain.setValueAtTime(peakVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        });

        // --- NEW SOUNDS START HERE ---

        // Jump Sound
        this.registerSound('jump', {
            description: 'A short, upward-pitching sound for jumping actions.',
            emoji: '🤸',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'triangle';
            const startFreq = 440; // A4
            const endFreq = 880; // A5
            const now = audioCtx.currentTime;
            const duration = 0.15;

            oscillator.frequency.setValueAtTime(startFreq, now);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.8);

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        });

        // Explosion Sound
        this.registerSound('explosion', {
            description: 'A noisy burst sound for explosions.',
            emoji: '💣',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 1, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) {
                output[i] = Math.random() * 2 - 1; // White noise
            }

            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            noiseSource.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, audioCtx.currentTime); // Start broad
            filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.8); // Descend

            gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

            noiseSource.start(audioCtx.currentTime);
            noiseSource.stop(audioCtx.currentTime + 1);
        });

        // Power Up Sound
        this.registerSound('powerUp', {
            description: 'A bright, ascending arpeggio for power-ups.',
            emoji: '⭐',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const noteDuration = 0.08;
            let startTime = audioCtx.currentTime;

            freqs.forEach(freq => {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, startTime);
                osc.start(startTime);
                osc.stop(startTime + noteDuration);
                startTime += noteDuration;
            });
        });

        // Hit/Hurt Sound
        this.registerSound('hitHurt', {
            description: 'A short, impactful sound for taking damage.',
            emoji: '💔',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.type = 'sawtooth';
            const startFreq = 220; // A3
            const endFreq = 110; // A2
            const now = audioCtx.currentTime;
            const duration = 0.12;

            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.7);

            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

         // Select/Hover Sound
        this.registerSound('selectHover', {
            description: 'A very short, subtle sound for UI selection or hover.',
            emoji: '🖱️',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch
            const now = audioCtx.currentTime;
            const duration = 0.05;

            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // UI Click Sound
        this.registerSound('uiClick', {
            description: 'A sharp click sound for UI interactions.',
            emoji: '🔘',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            // Create a very short impulse
            for (let i = 0; i < 50; i++) { // ~1ms impulse
                data[i] = Math.random() * 0.5 - 0.25;
            }

            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            const gainNode = audioCtx.createGain();
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

            source.start(audioCtx.currentTime);
            source.stop(audioCtx.currentTime + 0.05);
        });

        // Alert Sound (Short, Repeating) - Renamed from 'alert'
        this.registerSound('alertShort', { // Renamed from 'alert'
            description: 'A repeating high-pitched beep for alerts.',
            emoji: '🚨',
            category: 'Alert/Status' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
            const now = audioCtx.currentTime;
            const beepDuration = 0.1;
            const gapDuration = 0.1;
            const totalDuration = 0.4; // 2 beeps

            gainNode.gain.setValueAtTime(0, now); // Start silent
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick fade in first beep
            gainNode.gain.setValueAtTime(0.3, now + beepDuration);
            gainNode.gain.linearRampToValueAtTime(0, now + beepDuration + 0.01); // Quick fade out
            // Gap
            gainNode.gain.setValueAtTime(0, now + beepDuration + gapDuration);
            gainNode.gain.linearRampToValueAtTime(0.3, now + beepDuration + gapDuration + 0.01); // Second beep in
            gainNode.gain.setValueAtTime(0.3, now + beepDuration * 2 + gapDuration);
            gainNode.gain.linearRampToValueAtTime(0, now + beepDuration * 2 + gapDuration + 0.01); // Second beep out

            osc.start(now);
            osc.stop(now + totalDuration);
        });

        // Synth Kick Drum
        this.registerSound('kickDrum', {
            description: 'A synthesized bass drum sound.',
            emoji: '🥁',
            category: 'Percussion' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 0.15;
            osc.frequency.setValueAtTime(150, now); // Start frequency
            osc.frequency.exponentialRampToValueAtTime(40, now + duration * 0.75); // Pitch drop

            gainNode.gain.setValueAtTime(1.0, now); // Punchy start
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

         // Synth Snare Drum
        this.registerSound('snareDrum', {
            description: 'A synthesized snare drum sound using noise.',
            emoji: '🥁',
            category: 'Percussion' // Added category
        }, (audioCtx) => {
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000; // Cut lows

            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(1, audioCtx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

            noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);

            // Add a short tone for body
            const osc = audioCtx.createOscillator();
            const oscGain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = 180;
            oscGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(oscGain).connect(audioCtx.destination);

            noiseSource.start(audioCtx.currentTime);
            noiseSource.stop(audioCtx.currentTime + 0.2);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.1);
        });

        // Synth Hi-Hat
        this.registerSound('hiHat', {
            description: 'A synthesized hi-hat cymbal sound.',
            emoji: '🥁',
            category: 'Percussion' // Added category
        }, (audioCtx) => {
            const fundamental = 40;
            const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21]; // Frequencies for metallic sound
            const gainNode = audioCtx.createGain();
            const bandpass = audioCtx.createBiquadFilter();

            bandpass.type = "bandpass";
            bandpass.frequency.value = 10000; // High frequency focus
            bandpass.Q.value = 0.5;

            gainNode.connect(bandpass).connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 0.08;

            ratios.forEach(ratio => {
                const osc = audioCtx.createOscillator();
                osc.type = "square";
                osc.frequency.value = fundamental * ratio;
                osc.connect(gainNode);
                osc.start(now);
                osc.stop(now + duration);
            });

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        });

        // Ambience Pad (Simple Example)
        this.registerSound('ambiencePad', {
            description: 'A soft, sustained pad sound for ambience.',
            emoji: '🎶',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc1.type = 'sine';
            osc1.frequency.value = 220; // A3
            osc2.type = 'sine';
            osc2.frequency.value = 220 * 1.5; // E4 (perfect fifth) slightly detuned
            osc2.detune.value = 5; // Slight detune for richness

            filter.type = 'lowpass';
            filter.frequency.value = 800;

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(filter);
            filter.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const attackTime = 0.5;
            const sustainDuration = 1.0; // Hold for 1 second before release
            const releaseTime = 1.5;
            const totalDuration = attackTime + sustainDuration + releaseTime;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + attackTime); // Attack
            gainNode.gain.setValueAtTime(0.2, now + attackTime + sustainDuration); // Sustain
            gainNode.gain.linearRampToValueAtTime(0, now + totalDuration); // Release

            osc1.start(now);
            osc1.stop(now + totalDuration);
            osc2.start(now);
            osc2.stop(now + totalDuration);
        });

        // Engine Hum/Idle
        this.registerSound('engineHum', {
            description: 'A low, steady hum like an engine idling.',
            emoji: '⚙️',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            const lfo = audioCtx.createOscillator(); // Low Frequency Oscillator for modulation
            const lfoGain = audioCtx.createGain();

            osc1.type = 'sawtooth';
            osc1.frequency.value = 60; // Low frequency
            osc2.type = 'sawtooth';
            osc2.frequency.value = 65; // Slightly detuned second oscillator

            filter.type = 'lowpass';
            filter.frequency.value = 150; // Muffled sound
            filter.Q.value = 5; // Some resonance

            lfo.type = 'sine';
            lfo.frequency.value = 5; // Slow modulation (5 Hz)
            lfoGain.gain.value = 10; // Modulation depth for filter frequency
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency); // Modulate filter cutoff

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 1.5; // Play for 1.5 seconds

            gainNode.gain.setValueAtTime(0.3, now); // Constant volume
            gainNode.gain.setValueAtTime(0.3, now + duration - 0.05); // Hold until near end
            gainNode.gain.linearRampToValueAtTime(0, now + duration); // Fade out quickly

            lfo.start(now);
            lfo.stop(now + duration);
            osc1.start(now);
            osc1.stop(now + duration);
            osc2.start(now);
            osc2.stop(now + duration);
        });

        // Zap/Electric Sound
        this.registerSound('zap', {
            description: 'A short, crackling electric zap sound.',
            emoji: '⚡',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'square'; // Harsh tone
            osc.connect(gainNode);
            gainNode.connect(filter);
            filter.connect(audioCtx.destination);

            filter.type = 'bandpass';
            filter.frequency.value = 1500;
            filter.Q.value = 20; // Very narrow band for 'electric' feel

            const now = audioCtx.currentTime;
            const duration = 0.08;

            // Rapid frequency modulation
            osc.frequency.setValueAtTime(100, now); // Start low
            osc.frequency.linearRampToValueAtTime(3000, now + duration * 0.3); // Rapid rise
            osc.frequency.linearRampToValueAtTime(500, now + duration); // Fall off

            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

         // Blip Sound (like old computer terminal)
        this.registerSound('blip', {
            description: 'A short, high-pitched blip sound.',
            emoji: '📟',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(1800, audioCtx.currentTime); // High frequency
            const now = audioCtx.currentTime;
            const duration = 0.06;

            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Door Open/Close Sound (simple whoosh)
        this.registerSound('whoosh', {
            description: 'A short whooshing sound, like a sliding door.',
            emoji: '🚪',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) {
                output[i] = Math.random() * 2 - 1; // White noise
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.value = 2; // Moderate Q

            const gainNode = audioCtx.createGain();

            noiseSource.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 0.3;

            // Sweep filter frequency for whoosh effect
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.exponentialRampToValueAtTime(3000, now + duration * 0.8);

            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

            noiseSource.start(now);
            noiseSource.stop(now + duration);
        });


        // Step Sound (simple tap)
        this.registerSound('step', {
            description: 'A light tap sound for footsteps.',
            emoji: '👣',
            category: 'Footsteps' // Added category
        }, (audioCtx) => {
             const osc = audioCtx.createOscillator();
             const gainNode = audioCtx.createGain();
             const filter = audioCtx.createBiquadFilter();

             osc.type = 'triangle'; // Softer than square
             osc.frequency.setValueAtTime(300, audioCtx.currentTime);

             filter.type = 'lowpass';
             filter.frequency.value = 600; // Muffle it slightly

             osc.connect(filter);
             filter.connect(gainNode);
             gainNode.connect(audioCtx.destination);

             const now = audioCtx.currentTime;
             const duration = 0.08;

             gainNode.gain.setValueAtTime(0.25, now);
             gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

             osc.start(now);
             osc.stop(now + duration);
        });

        // Collect Item (variation of coin)
        this.registerSound('collectItem', {
            description: 'A slightly different item collection sound.',
            emoji: '💎',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.type = 'sine'; // Smoother than triangle/square
            const freq1 = 1046.50; // C6
            const freq2 = 1567.98; // G6
            const now = audioCtx.currentTime;
            const duration = 0.1;

            osc.frequency.setValueAtTime(freq1, now);
            osc.frequency.linearRampToValueAtTime(freq2, now + duration * 0.7);

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

         // Warning Beep
        this.registerSound('warningBeep', {
            description: 'A short, medium-pitch warning beep.',
            emoji: '⚠️',
            category: 'Alert/Status' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.type = 'sawtooth'; // Slightly harsher
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            const now = audioCtx.currentTime;
            const duration = 0.15;

            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Success Fanfare (simple short version)
        this.registerSound('successFanfare', {
            description: 'A short, positive fanfare for success.',
            emoji: '🎉',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.7);

            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (like powerup)
            const durations = [0.1, 0.1, 0.1, 0.3]; // Last note longer
            let startTime = audioCtx.currentTime;

            for (let i = 0; i < freqs.length; i++) {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freqs[i], startTime);
                osc.start(startTime);
                osc.stop(startTime + durations[i]);
                startTime += durations[i] + 0.02; // Small gap
            }
        });

        // Game Over Sound (descending, minor feel)
        this.registerSound('gameOver', {
            description: 'A descending, sad sound for game over.',
            emoji: '💀',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5);

            // Descending minor chord tones (e.g., C minor: C, Eb, G -> G, Eb, C)
            const freqs = [783.99, 622.25, 523.25]; // G5, Eb5, C5
            const durations = [0.4, 0.4, 0.6];
            let startTime = audioCtx.currentTime;

             for (let i = 0; i < freqs.length; i++) {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freqs[i], startTime);
                osc.start(startTime);
                osc.stop(startTime + durations[i]);
                startTime += durations[i] + 0.05; // Small gap
            }
        });

        // Laser Charge Sound
        this.registerSound('laserCharge', {
            description: 'A rising pitch sound indicating a charge-up.',
            emoji: '🔋',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            filter.type = 'lowpass';
            filter.Q.value = 3;

            const now = audioCtx.currentTime;
            const duration = 0.8;

            // Rising pitch
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(1200, now + duration);

            // Rising filter cutoff - makes it brighter as it charges
            filter.frequency.setValueAtTime(200, now);
            filter.frequency.linearRampToValueAtTime(4000, now + duration);

            // Gain swells slightly
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + duration * 0.8);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Cut off at end

            osc.start(now);
            osc.stop(now + duration);
        });

         // Teleport Sound
        this.registerSound('teleport', {
            description: 'A sci-fi teleportation sound effect.',
            emoji: '🌀',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const lfo = audioCtx.createOscillator(); // LFO for frequency modulation
            const lfoGain = audioCtx.createGain();

            osc.type = 'sine';
            lfo.type = 'sawtooth';
            lfo.frequency.value = 30; // Fast modulation for shimmering effect
            lfoGain.gain.value = 50; // Modulation depth

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency); // Modulate oscillator frequency
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 0.5;

            // Rapidly rising base frequency
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(1600, now + duration);

            // Gain fades in and out
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + duration * 0.2);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);

            lfo.start(now);
            lfo.stop(now + duration);
            osc.start(now);
            osc.stop(now + duration);
        });

         // Bubble Pop Sound
        this.registerSound('bubblePop', {
            description: 'A soft, popping sound like a bubble.',
            emoji: '💧',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.type = 'sine';
            const now = audioCtx.currentTime;
            const duration = 0.1;

            // Quick pitch drop
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + duration * 0.8);

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Low Rumble
        this.registerSound('lowRumble', {
            description: 'A deep, sustained rumbling sound.',
            emoji: '🌋',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true; // Loop the noise

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 80; // Very low cutoff
            filter.Q.value = 10; // High resonance for rumble feel

            const gainNode = audioCtx.createGain();

            noiseSource.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 2.0;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.5); // Fade in
            gainNode.gain.setValueAtTime(0.4, now + duration - 0.5); // Hold
            gainNode.gain.linearRampToValueAtTime(0, now + duration); // Fade out

            noiseSource.start(now);
            // Note: We don't call stop explicitly here if we want it controllable externally
            // For this registration, let's stop it after duration.
            noiseSource.stop(now + duration);
        });

        // Glitch Sound
        this.registerSound('glitch', {
            description: 'A short, erratic glitch sound.',
            emoji: '👾',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const duration = 0.1;
            const now = audioCtx.currentTime;

            // Short burst of noise
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * (duration / 2), audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.2, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration / 2);
            noiseSource.connect(noiseGain).connect(audioCtx.destination);

            // Short, rapidly changing pitch tone
            const osc = audioCtx.createOscillator();
            const oscGain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(2000, now + duration / 3); // Start later
            osc.frequency.linearRampToValueAtTime(500, now + duration);
            oscGain.gain.setValueAtTime(0.2, now + duration / 3);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
            osc.connect(oscGain).connect(audioCtx.destination);

            noiseSource.start(now);
            noiseSource.stop(now + duration / 2);
            osc.start(now + duration / 3);
            osc.stop(now + duration);
        });

        // --- END OF NEW SOUNDS ---

        // --- START OF ADDITIONAL 30 SOUNDS ---

        // Power Down Sound
        this.registerSound('powerDown', {
            description: 'Opposite of Power Up, descending.',
            emoji: '📉',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

            const freqs = [1046.50, 783.99, 659.25, 523.25]; // C6, G5, E5, C5 (Descending)
            const noteDuration = 0.1;
            let startTime = audioCtx.currentTime;

            freqs.forEach(freq => {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, startTime);
                osc.start(startTime);
                osc.stop(startTime + noteDuration);
                startTime += noteDuration + 0.03;
            });
        });

        // Shield Hit Sound
        this.registerSound('shieldHit', {
            description: 'Metallic clang for shield impact.',
            emoji: '🛡️',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            gainNode.connect(filter).connect(audioCtx.destination);

            filter.type = 'highpass';
            filter.frequency.value = 2000;
            filter.Q.value = 1.5;

            const fundamental = 110; // A2
            const ratios = [1, 2.7, 4.2, 5.8, 7.1, 9.9]; // Inharmonic ratios for clang
            const now = audioCtx.currentTime;
            const duration = 0.25;

            ratios.forEach(ratio => {
                const osc = audioCtx.createOscillator();
                osc.type = 'square';
                osc.frequency.value = fundamental * ratio;
                osc.connect(gainNode);
                osc.start(now);
                osc.stop(now + duration * (Math.random() * 0.5 + 0.5)); // Randomize decay slightly
            });

            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        });

        // Level Up Jingle
        this.registerSound('levelUp', {
            description: 'Short, bright jingle for leveling up.',
            emoji: '📈',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.0);

            const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
            const durations = [0.1, 0.1, 0.1, 0.2, 0.3];
            let startTime = audioCtx.currentTime;

            for (let i = 0; i < freqs.length; i++) {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freqs[i], startTime);
                osc.start(startTime);
                osc.stop(startTime + durations[i]);
                startTime += durations[i] + 0.03;
            }
        });

        // Item Drop Sound
        this.registerSound('itemDrop', {
            description: 'Sound of an item appearing or dropping.',
            emoji: '🎁',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);

            osc.type = 'sine';
            const now = audioCtx.currentTime;
            const duration = 0.18;

            // Descending pitch
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + duration * 0.8);

            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Scanner Ping Sound
        this.registerSound('scannerPing', {
            description: 'A sonar-like ping sound.',
            emoji: '📡',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);

            filter.type = 'bandpass';
            filter.frequency.value = 1000;
            filter.Q.value = 15;

            osc.connect(filter).connect(gainNode).connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 0.8; // Longer decay for ping echo

            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + 0.1); // Short actual tone, long decay via gain
        });

        // Computer Voice Blip (short, varied)
        this.registerSound('computerBlip1', {
            description: 'Short robotic/computer blip.',
            emoji: '🤖',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);

            osc.type = 'square';
            const freq = 800 + Math.random() * 400;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            const now = audioCtx.currentTime;
            const duration = 0.04 + Math.random() * 0.03;

            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Computer Voice Blip 2 (slightly longer)
        this.registerSound('computerBlip2', {
            description: 'Another short robotic/computer blip.',
            emoji: '🤖',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);

            osc.type = 'sawtooth';
            const freq = 600 + Math.random() * 300;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            const now = audioCtx.currentTime;
            const duration = 0.07 + Math.random() * 0.04;

            gainNode.gain.setValueAtTime(0.18, now);
            gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Short Musical Stinger (Positive)
        this.registerSound('stingerPositive', {
            description: 'Short positive musical phrase.',
            emoji: '✨',
            category: 'Music' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

            const freqs = [783.99, 1046.50, 1318.51]; // G5, C6, E6
            const durations = [0.1, 0.1, 0.2];
            let startTime = audioCtx.currentTime;

            for (let i = 0; i < freqs.length; i++) {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freqs[i], startTime);
                osc.start(startTime);
                osc.stop(startTime + durations[i]);
                startTime += durations[i] + 0.02;
            }
        });

         // Short Musical Stinger (Negative)
        this.registerSound('stingerNegative', {
            description: 'Short negative musical phrase.',
            emoji: '😨',
            category: 'Music' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

            const freqs = [622.25, 523.25, 415.30]; // Eb5, C5, Ab4
            const durations = [0.15, 0.15, 0.25];
            let startTime = audioCtx.currentTime;

            for (let i = 0; i < freqs.length; i++) {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freqs[i], startTime);
                osc.start(startTime);
                osc.stop(startTime + durations[i]);
                startTime += durations[i] + 0.03;
            }
        });

        // Digital Static Sound
        this.registerSound('digitalStatic', {
            description: 'Short burst of digital-like static.',
            emoji: '📺',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            // Create crackling by alternating high/low values rapidly
            for (let i = 0; i < noiseBuffer.length; i++) {
                output[i] = (i % 5 < 2) ? Math.random() * 0.8 - 0.4 : 0; 
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 4000;
            filter.Q.value = 3;

            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

            noiseSource.connect(filter).connect(gainNode).connect(audioCtx.destination);
            noiseSource.start(audioCtx.currentTime);
            noiseSource.stop(audioCtx.currentTime + 0.3);
        });

        // Footstep on Metal Sound
        this.registerSound('stepMetal', {
            description: 'Footstep sound on a metallic surface.',
            emoji: '🔩',
            category: 'Footsteps' // Added category
        }, (audioCtx) => {
             const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
             const output = noiseBuffer.getChannelData(0);
             for(let i=0; i<noiseBuffer.length; i++) output[i] = Math.random() * 0.6 - 0.3;
             const noiseSource = audioCtx.createBufferSource();
             noiseSource.buffer = noiseBuffer;

             const filter = audioCtx.createBiquadFilter();
             filter.type = 'highpass';
             filter.frequency.value = 1500;

             const gainNode = audioCtx.createGain();
             gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
             gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

             noiseSource.connect(filter).connect(gainNode).connect(audioCtx.destination);
             noiseSource.start(audioCtx.currentTime);
             noiseSource.stop(audioCtx.currentTime + 0.1);
        });

        // Footstep on Wood Sound
        this.registerSound('stepWood', {
            description: 'Footstep sound on a wooden surface.',
            emoji: '🪵',
            category: 'Footsteps' // Added category
        }, (audioCtx) => {
             const osc = audioCtx.createOscillator();
             const gainNode = audioCtx.createGain();
             const filter = audioCtx.createBiquadFilter();

             osc.type = 'sine'; // Resonant body
             osc.frequency.setValueAtTime(150, audioCtx.currentTime);

             filter.type = 'lowpass';
             filter.frequency.value = 400; // Muffled wood sound

             osc.connect(filter).connect(gainNode).connect(audioCtx.destination);

             const now = audioCtx.currentTime;
             const duration = 0.1;

             gainNode.gain.setValueAtTime(0.3, now);
             gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

             osc.start(now);
             osc.stop(now + duration);
        });

        // UI Toggle On Sound
        this.registerSound('toggleOn', {
            description: 'Sound for switching a toggle on.',
            emoji: '🟢',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);
            osc.type = 'triangle';
            const now = audioCtx.currentTime;
            osc.frequency.setValueAtTime(880, now); // A5
            osc.frequency.linearRampToValueAtTime(1108.73, now + 0.05); // C#6
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        });

        // UI Toggle Off Sound
        this.registerSound('toggleOff', {
            description: 'Sound for switching a toggle off.',
            emoji: '🔴',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);
            osc.type = 'triangle';
            const now = audioCtx.currentTime;
            osc.frequency.setValueAtTime(1108.73, now); // C#6
            osc.frequency.linearRampToValueAtTime(880, now + 0.05); // A5
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        });

        // Notification Sound 1 (Simple Ding)
        this.registerSound('notification1', {
            description: 'Simple notification ding sound.',
            emoji: '🔔',
            category: 'Alert/Status' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1567.98, audioCtx.currentTime); // G6
            const now = audioCtx.currentTime;
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4); // Longer decay
            osc.start(now);
            osc.stop(now + 0.1); // Short tone, longer gain decay
        });

        // Notification Sound 2 (Two Tone)
        this.registerSound('notification2', {
            description: 'Two-tone notification sound.',
            emoji: '🎶',
            category: 'Alert/Status' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);

            const freqs = [1046.50, 1318.51]; // C6, E6
            const durations = [0.08, 0.12];
            let startTime = audioCtx.currentTime;

            for (let i = 0; i < freqs.length; i++) {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freqs[i], startTime);
                osc.start(startTime);
                osc.stop(startTime + durations[i]);
                startTime += durations[i] + 0.02;
            }
        });

        // Character Grunt/Effort Sound
        this.registerSound('grunt', {
            description: 'Short grunt or effort sound.',
            emoji: '😤',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
             const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
             const output = noiseBuffer.getChannelData(0);
             for(let i=0; i<noiseBuffer.length; i++) output[i] = Math.random() * 0.5 - 0.25;
             const noiseSource = audioCtx.createBufferSource();
             noiseSource.buffer = noiseBuffer;

             const filter = audioCtx.createBiquadFilter();
             filter.type = 'bandpass';
             filter.frequency.setValueAtTime(300, audioCtx.currentTime);
             filter.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.1);
             filter.Q.value = 2;

             const gainNode = audioCtx.createGain();
             gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
             gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

             noiseSource.connect(filter).connect(gainNode).connect(audioCtx.destination);
             noiseSource.start(audioCtx.currentTime);
             noiseSource.stop(audioCtx.currentTime + 0.15);
        });

        // Warp Drive Engage Sound
        this.registerSound('warpEngage', {
            description: 'Sound of engaging a warp drive.',
            emoji: '🚀',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();

            osc.type = 'sawtooth';
            filter.type = 'lowpass';
            filter.Q.value = 8;
            lfo.type = 'sine';
            lfo.frequency.value = 5; // Slow LFO start
            lfoGain.gain.value = 100; // LFO Depth

            lfo.connect(lfoGain).connect(osc.frequency); // LFO modulates frequency
            osc.connect(filter).connect(gainNode).connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 1.5;

            // Rising base pitch
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(800, now + duration);
            // Increasing LFO speed
            lfo.frequency.linearRampToValueAtTime(50, now + duration);
            // Rising Filter Cutoff
            filter.frequency.setValueAtTime(200, now);
            filter.frequency.linearRampToValueAtTime(5000, now + duration);
            // Gain swell
            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + duration * 0.8);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            lfo.start(now);
            lfo.stop(now + duration);
            osc.start(now);
            osc.stop(now + duration);
        });

        // Tractor Beam Sound
        this.registerSound('tractorBeam', {
            description: 'Humming sound of a tractor beam.',
            emoji: '🛸',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const lfo = audioCtx.createOscillator(); // LFO for amplitude modulation (tremolo)
            const lfoGain = audioCtx.createGain();

            osc1.type = 'sine';
            osc1.frequency.value = 110; // A2
            osc2.type = 'sine';
            osc2.frequency.value = 115; // Detuned

            lfo.type = 'sine';
            lfo.frequency.value = 8; // Tremolo speed
            lfoGain.gain.value = 0.2; // Tremolo depth (modulates gainNode)

            lfo.connect(lfoGain).connect(gainNode.gain); // LFO modulates gain

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 2.0;

            gainNode.gain.setValueAtTime(0.3, now); // Base gain before LFO modulation
            gainNode.gain.setValueAtTime(0.3, now + duration - 0.1);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);

            lfo.start(now);
            lfo.stop(now + duration);
            osc1.start(now);
            osc1.stop(now + duration);
            osc2.start(now);
            osc2.stop(now + duration);
        });

        // Simple Wind Sound
        this.registerSound('wind', {
            description: 'Soft blowing wind sound.',
            emoji: '🌬️',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 3, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass'; // Filter noise to sound like wind
            filter.frequency.value = 500; // Center frequency
            filter.Q.value = 0.8;

            // Add LFO to modulate filter frequency slightly for varying wind
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            lfo.type = 'sine';
            lfo.frequency.value = 0.2; // Very slow modulation
            lfoGain.gain.value = 100; // Modulation depth
            lfo.connect(lfoGain).connect(filter.frequency);

            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 1);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + 2.5);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);

            noiseSource.connect(filter).connect(gainNode).connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 3.0;
            lfo.start(now);
            lfo.stop(now + duration);
            noiseSource.start(now);
            noiseSource.stop(now + duration);
        });

        // Charge Shot Release Sound
        this.registerSound('chargeShotRelease', {
            description: 'Sound of releasing a charged shot.',
            emoji: '💥',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const noiseSource = audioCtx.createBufferSource();
            const noiseGain = audioCtx.createGain();
            const noiseFilter = audioCtx.createBiquadFilter();

            // Main tone burst
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // High start
            osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2); // Quick drop
            osc.connect(gainNode).connect(audioCtx.destination);

            // Noise burst for impact
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;
            noiseSource.buffer = noiseBuffer;
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 3000;
            noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration = 0.25;

            gainNode.gain.setValueAtTime(0.5, now); // Strong initial burst
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noiseGain.gain.setValueAtTime(0.3, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.start(now);
            osc.stop(now + duration);
            noiseSource.start(now);
            noiseSource.stop(now + 0.15);
        });

        // Simple Robot Movement Sound
        this.registerSound('robotMove', {
            description: 'Whirring/clicking of robot movement.',
            emoji: '🦾',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const now = audioCtx.currentTime;
            const duration = 0.4;

            // Whirring noise
            const noiseSource = audioCtx.createBufferSource();
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for(let i=0; i<output.length; i++) output[i] = Math.random() * 0.4 - 0.2;
            noiseSource.buffer = noiseBuffer;
            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 800;
            noiseFilter.Q.value = 5;
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.2, now);
            noiseGain.gain.linearRampToValueAtTime(0, now + duration);
            noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);

            // Clicks
            const clickGain = audioCtx.createGain();
            clickGain.connect(audioCtx.destination);
            const clickTimes = [0.05, 0.18, 0.3];
            clickTimes.forEach(time => {
                const osc = audioCtx.createOscillator();
                osc.type='square';
                osc.frequency.value = 1500;
                osc.connect(clickGain);
                clickGain.gain.setValueAtTime(0.15, now + time);
                clickGain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.03);
                osc.start(now + time);
                osc.stop(now + time + 0.03);
            });

            noiseSource.start(now);
            noiseSource.stop(now + duration);
        });

        // Alarm Loop (Continuous)
        this.registerSound('alarmLoop', {
            description: 'Continuous alarm sound (needs external stop).',
            emoji: '🚨',
            category: 'Alert/Status' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);

            osc.type = 'square';
            osc.frequency.value = 1200;
            gainNode.gain.value = 0.2;

            // Use LFO to create on/off pattern
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            lfo.type = 'square';
            lfo.frequency.value = 2; // 2 beeps per second
            lfoGain.gain.value = 1; // Full modulation depth

            lfo.connect(lfoGain).connect(gainNode.gain); // Modulate gain

            osc.start(audioCtx.currentTime);
            lfo.start(audioCtx.currentTime);
            // NOTE: This sound will not stop on its own! Requires external handling.
            // Example external stop: find the oscillator/LFO nodes and call .stop()
        });

        // Water Drop Sound
        this.registerSound('waterDrop', {
            description: 'Single water drop sound.',
            emoji: '💧',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);

            osc.type = 'sine';
            const now = audioCtx.currentTime;
            const duration = 0.15;

            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + duration * 0.9);

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Book Page Turn Sound
        this.registerSound('pageTurn', {
            description: 'Sound of turning a page.',
            emoji: '📖',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 0.6 - 0.3; // Pink-ish noise
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 800;
            filter.Q.value = 0.5;

            const gainNode = audioCtx.createGain();
            const now = audioCtx.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            noiseSource.connect(filter).connect(gainNode).connect(audioCtx.destination);
            noiseSource.start(now);
            noiseSource.stop(now + 0.4);
        });

        // Heartbeat Sound
        this.registerSound('heartbeat', {
            description: 'Simple heartbeat thump sound.',
            emoji: '❤️',
            category: 'Game/Action' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            const duration1 = 0.1;
            const duration2 = 0.1;
            const gap = 0.15;

            // First thump (Lub)
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + duration1 * 0.8);
            gainNode.gain.setValueAtTime(0.6, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration1);
            osc.start(now);
            osc.stop(now + duration1);

            // Second thump (Dub) - slightly higher pitch, shorter
            // Need a new oscillator for the second part
            const osc2 = audioCtx.createOscillator();
            const gainNode2 = audioCtx.createGain(); // Separate gain allows independent control
            osc2.connect(gainNode2).connect(audioCtx.destination);
            osc2.frequency.setValueAtTime(120, now + duration1 + gap);
            osc2.frequency.exponentialRampToValueAtTime(60, now + duration1 + gap + duration2 * 0.7);
            gainNode2.gain.setValueAtTime(0.5, now + duration1 + gap);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, now + duration1 + gap + duration2);
            osc2.start(now + duration1 + gap);
            osc2.stop(now + duration1 + gap + duration2);
        });

         // Magic Spell Cast Sound
        this.registerSound('magicSpell', {
            description: 'Shimmering sound for casting magic.',
            emoji: '🪄',
            category: 'Sci-Fi/Environment' // Added category
        }, (audioCtx) => {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            const duration = 0.7;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            // Multiple detuned oscillators for shimmer
            const baseFreq = 880;
            for(let i=0; i<5; i++) {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = baseFreq * (1 + (Math.random() - 0.5) * 0.05); // Slight random detune
                osc.detune.setValueAtTime(0, now);
                osc.detune.linearRampToValueAtTime(100 + Math.random() * 200, now + duration * 0.8); // Pitch rise
                osc.connect(gainNode);
                osc.start(now);
                osc.stop(now + duration * (0.8 + Math.random()*0.2));
            }
        });

        // UI Error/Denied Sound
        this.registerSound('denied', {
            description: 'Short buzz/thud for denied action.',
            emoji: '🚫',
            category: 'UI/Interaction' // Added category
        }, (audioCtx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode).connect(audioCtx.destination);
            osc.type = 'square';
            const now = audioCtx.currentTime;
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.1);
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        });


        // --- END OF ADDITIONAL SOUNDS ---

    }
};

// Automatically register default sounds when the script loads
RetroWaveFX.Audio._registerDefaultSounds();

// --- Keep the User Interaction Initializer ---
// This is still important for browsers requiring interaction
function initializeAudioOnInteraction() {
    console.log("User interaction detected, attempting to initialize AudioContext.");
    // We only need to call initAudio. It handles the suspended state if needed.
    RetroWaveFX.Audio.initAudio();
    // No need to remove listeners if they are { once: true }
}

// Listen for common interaction events on the body using { once: true }
// This ensures initAudio runs at the first opportunity but doesn't repeatedly attach listeners.
document.body.addEventListener('click', initializeAudioOnInteraction, { once: true });
document.body.addEventListener('keydown', initializeAudioOnInteraction, { once: true });
document.body.addEventListener('touchstart', initializeAudioOnInteraction, { once: true }); 