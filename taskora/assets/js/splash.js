
document.addEventListener("DOMContentLoaded", () => {
    const splash = document.getElementById("splashScreen");

    if (!splash) return;

    const tasks = splash.querySelectorAll(".splash-task");
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // Prevent scrolling while the intro is visible.
    document.body.style.overflow = "hidden";

    // Tick the tasks one after another.
    tasks.forEach((task, index) => {
        const delay = reducedMotion ? 0 : 850 + index * 650;

        window.setTimeout(() => {
            task.classList.add("is-checked");
        }, delay);
    });

    // Show the homepage after the animation.
    const introDuration = reducedMotion ? 500 : 3900;

    window.setTimeout(() => {
        splash.classList.add("splash-hidden");
        document.body.style.overflow = "";

        // Remove the intro from the page after fading out.
        window.setTimeout(() => {
            splash.remove();
        }, reducedMotion ? 0 : 850);
    }, introDuration);
});
