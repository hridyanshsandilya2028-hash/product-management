# Project Ouroboros: The Grey Fog Above

An interactive portfolio realm for Hridyansh Sandilya. The visitor becomes the Fool: a visible cloaked figure walking through an endless grey fog toward a long bronze council table. Chairs and distant stars hold the portfolio's work, questions, concepts, and reflections.

## Run it

```bash
npm install
npm run dev
```

The experience is client-side and works without microphone access or sound. Use **Classic View** for a complete, keyboard-friendly reading route.

## Decisions

- The scene is a third-person, over-the-shoulder procedural Three.js world. Press `V` to toggle first person.
- Click the world to capture the mouse; use `WASD` for an accelerated ceremonial walk, `Shift` for a slower deeper step, `Space` to toggle drift, and `Q` / `E` to move vertically while drifting. Movement includes collision sliding, camera lag, fog wake, landing mist, and click-gated procedural Web Audio footsteps.
- The Fool is an embodied procedural character: hat, hood, coat, cloak layers, articulated arms and legs, gloves, boots, cyan pendant, walk cycle, cloak sway, and fading footprints. Press `H` to show the collision capsule.
- Stars are reachable world destinations rather than menu-only items: follow the stepping-stone trail, drift across distant gaps, land on a cracked platform, then press `E` or click a star to raise the Fool's hand and open its light-card. Press `N` to toggle a lantern wisp toward the nearest unread star.
- The Grey Fog Above is layered and responsive: animated ground mist, slow mid-level banks, a ceiling sky with a cracked moon and aurora gaps, half-seen distant silhouettes, and tendrils that gather near chairs and stars. Reading chapters gradually shifts the fog tint and density, wakes the aurora, and swells the ambient choir; sound begins after the first click.
- The long table, high-backed chairs, floating stars, Fool avatar, fog, and lantern light are all procedural. There are no downloaded models or textures.
- Portfolio copy is centralized in `src/data/content.ts` so the atmospheric layer cannot invent facts.
- The visual language is intentionally quieter than a game: the fog is the invitation; plain copy is the proof.
- The story is now a first-class layer in `src/data/story.ts`: nine story stars form a luminous thread around the table, with a guided Walk the Story mode, chapter reader, Book of the Loop, and full Classic View story.
- The Whisper Spire and question ritual are labelled as concept or simulated demonstration where appropriate.
- The supplied Good Days photo album is extracted into `public/album/` and appears as a bronze-framed, clickable memory reliquary in the fog. Selecting a photograph opens it in the same restrained story-panel language as the stars.
- The supplied throwback album is extracted into `public/throwbacks/` and appears as a separate "Before the Fog" archive along the outer approach, keeping earlier memories distinct from the Good Days reliquary while using the same clickable in-world frame treatment.
