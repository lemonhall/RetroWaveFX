# RetroWaveFX

A JavaScript library for programmatically generating classic game sound effects (like those from the NES/FC era) using the Web Audio API.

**➡️ Live Demo: [https://lemonhall.github.io/RetroWaveFX/](https://lemonhall.github.io/RetroWaveFX/) ⬅️**

## Goal

To avoid using pre-recorded audio files by synthesizing and controlling sounds directly through code, providing a flexible and lightweight solution for game sound effects.

It comes pre-packaged with **over 90 ready-to-use classic game sound effects**.

## Current Status

-   Core `Audio` object with initialization logic (`initAudio`) handling browser autoplay policies.
-   **Sound Effect Registry:** Implemented a registry (`soundEffects`) to manage sound definitions.
-   **Metadata:** Each sound effect includes metadata: `name`, `description`, and `emoji`.
-   **Management Methods:** Added methods like `registerSound`, `getAllSoundEffects`, and `playSoundByName`.
-   **Example Sounds:** Includes initial sounds: `correct` (✅), `error` (❌), `laserShoot` (💥), `coinPickup` (💰).
-   **Test Page:** Created `index.html` which dynamically generates UI buttons for each registered sound effect, allowing easy testing and demonstration.

## How to Use

1.  **Include the Library:** Add the script to your HTML:
    ```html
    <script src="src/RetroWaveFX.js"></script>
    ```
2.  **Define Sounds (Optional):** While default sounds are registered, you can add your own:
    ```javascript
    RetroWaveFX.Audio.registerSound('mySound', {
        description: 'A custom sound effect.',
        emoji: '🎶'
    }, (audioCtx) => {
        // ... Web Audio API code to generate the sound ...
        const osc = audioCtx.createOscillator();
        // ... setup oscillator, gain, etc. ...
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    });
    ```
3.  **Trigger Initialization:** The library attempts to initialize the `AudioContext` on the first user interaction (click, keydown, touchstart) on the `document.body`.
4.  **Play Sounds:** Play sounds by their registered name:
    ```javascript
    // Play the coin pickup sound
    RetroWaveFX.Audio.playSoundByName('coinPickup');
    ```

## Development & Testing

-   Open `index.html` in your browser or visit the **[Live Demo](https://lemonhall.github.io/RetroWaveFX/)**.
-   The page automatically lists all registered sound effects as buttons.
-   **Search:** Use the search bar at the top to filter sounds by name, description, or category.
-   Click the buttons to play the sounds. Hover over them to see their descriptions.
-   Check the browser's developer console for logs (initialization, registration, playback errors).

**Note:** `AudioContext` requires user interaction to start/resume in most modern browsers. The included `index.html` and the library's body listeners handle this.

## Future Plans

-   Add more classic sound effects (jump, explosion, power-up, etc.).
-   Provide more flexible parameter configuration for sounds.
-   Explore noise generation for effects like explosions.
-   Potential modularization (e.g., ES Modules).
-   Consider adding support for simple music sequence playback.

See [README.zh.md](README.zh.md) for the Chinese version.
