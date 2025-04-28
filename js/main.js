document.addEventListener('DOMContentLoaded', () => {
    const soundButtonContainer = document.getElementById('sound-buttons');
    const searchInput = document.getElementById('search-input'); // Get the search input
    let allButtonWrappers = []; // Store all button wrappers for filtering
    
    // Check if RetroWaveFX and its methods are available
    if (typeof RetroWaveFX === 'undefined' || typeof RetroWaveFX.Audio === 'undefined' || typeof RetroWaveFX.Audio.getAllSoundEffects === 'undefined') {
        console.error('RetroWaveFX library not loaded correctly.');
        soundButtonContainer.innerHTML = '<p>Error: RetroWaveFX library not loaded.</p>';
        return;
    }

    const sounds = RetroWaveFX.Audio.getAllSoundEffects();

    if (!sounds || sounds.length === 0) {
        soundButtonContainer.innerHTML = '<p>No sound effects registered in RetroWaveFX.</p>';
        // No need to return here, we still want to initialize highlight/clipboard
    } else {
        sounds.forEach(sound => {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'tooltip';
            // Store sound data on the wrapper for easy filtering
            buttonWrapper.dataset.name = sound.name.toLowerCase();
            buttonWrapper.dataset.description = sound.description.toLowerCase();
            // Ensure category exists and is stored, default to empty string if not
            buttonWrapper.dataset.category = (sound.category || '').toLowerCase(); 

            const button = document.createElement('button');
            
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = sound.emoji;
            
            const textSpan = document.createElement('span');
            textSpan.textContent = sound.name;
            
            button.appendChild(emojiSpan);
            button.appendChild(textSpan);

            button.addEventListener('click', () => {
                // Ensure initAudio is called before playing
                if (typeof RetroWaveFX.Audio.initAudio === 'function') {
                    RetroWaveFX.Audio.initAudio(); 
                } else {
                    console.error('RetroWaveFX.Audio.initAudio function not found.');
                }
                // Ensure playSoundByName is available
                if (typeof RetroWaveFX.Audio.playSoundByName === 'function') {
                    RetroWaveFX.Audio.playSoundByName(sound.name);
                } else {
                    console.error('RetroWaveFX.Audio.playSoundByName function not found.');
                }
            });

            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltiptext';
            tooltipText.textContent = sound.description;

            buttonWrapper.appendChild(button);
            buttonWrapper.appendChild(tooltipText);
            // Don't append directly, store first
            allButtonWrappers.push(buttonWrapper); 
        });
        // Append all wrappers initially
        allButtonWrappers.forEach(wrapper => soundButtonContainer.appendChild(wrapper));
        console.log(`UI generated for ${allButtonWrappers.length} sound effects.`);
    }

    // Add event listener for search input
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        allButtonWrappers.forEach(wrapper => {
            const nameMatch = wrapper.dataset.name.includes(searchTerm);
            const descriptionMatch = wrapper.dataset.description.includes(searchTerm);
            const categoryMatch = wrapper.dataset.category.includes(searchTerm);
            
            // Show if any field matches, hide otherwise
            if (nameMatch || descriptionMatch || categoryMatch) {
                wrapper.style.display = ''; // Show the button wrapper
            } else {
                wrapper.style.display = 'none'; // Hide the button wrapper
            }
        });
    });

    // Initialize syntax highlighting if hljs is available
    if (typeof hljs !== 'undefined') {
        try {
            hljs.highlightAll();
        } catch (e) {
            console.error('Error initializing highlight.js:', e);
        }
    } else {
        console.warn('highlight.js library not found.');
    }
    
    // Initialize clipboard.js if ClipboardJS is available
    if (typeof ClipboardJS !== 'undefined') {
        try {
            const clipboard = new ClipboardJS('.copy-btn', {
                target: function(trigger) {
                    // Find the <code> element within the <pre> tag inside the parent container
                    const codeContainer = trigger.closest('.code-container');
                    if (codeContainer) {
                        return codeContainer.querySelector('pre code');
                    }
                    console.warn('Could not find parent .code-container for copy button.');
                    return null; // Return null if target isn't found
                }
            });

            clipboard.on('success', function(e) {
                console.log('Text copied to clipboard:', e.text);
                e.clearSelection();

                // Add copy feedback
                const trigger = e.trigger;
                const originalHtml = trigger.innerHTML;
                trigger.innerHTML = '<i class="fas fa-check"></i>';
                trigger.classList.add('copied');
                
                setTimeout(() => {
                    trigger.innerHTML = originalHtml;
                    trigger.classList.remove('copied');
                }, 2000);
            });

            clipboard.on('error', function(e) {
                console.error('Failed to copy text:', e);
                alert('Failed to copy text. Please try again.');
            });

        } catch (e) {
            console.error('Error initializing clipboard.js:', e);
        }
    } else {
        console.warn('ClipboardJS library not found.');
    }
}); 