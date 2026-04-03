/**
 * Showcase section navigation.
 * Controls which section is visible, updates the indicator,
 * and handles both button clicks and keyboard arrows.
 */
(function () {
    const sections = document.querySelectorAll('.showcase-section');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentIndexDisplay = document.getElementById('current-index');
    const total = sections.length;

    let current = 0;

    /**
     * Shows the section at the given index and hides all others.
     * Updates the indicator text and button disabled states.
     */
    function goToSection(index) {
        // Guard against out-of-range
        if (index < 0 || index >= total) return;

        // Hide current, show target
        sections[current].setAttribute('hidden', '');
        sections[index].removeAttribute('hidden');

        current = index;

        // Update indicator
        currentIndexDisplay.textContent = current + 1;

        // Update button states
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === total - 1;
    }

    // Button clicks
    prevBtn.addEventListener('click', () => goToSection(current - 1));
    nextBtn.addEventListener('click', () => goToSection(current + 1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goToSection(current - 1);
        if (e.key === 'ArrowRight') goToSection(current + 1);
    });
})();
