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
            emoji: sound.emoji
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
            emoji: '✅'
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
            emoji: '❌'
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
            emoji: '💥'
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
            emoji: '💰'
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