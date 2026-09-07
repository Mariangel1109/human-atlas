# VLI™ Digital Twin Viewer v1

## Purpose

This viewer is the interactive 3D module inside the future VLI application. It is not the entire application and it is not a static render. Its job is to help a patient understand: **how I am today, which organ/system is affected, what separates me from the target state, and what we are trying to improve.**

## What v1 must deliver

The viewer is accepted as v1 when all of these behaviors work on desktop and mobile:

1. A complete anatomical human body is visible in 3D.
2. The body can rotate 360° by mouse or touch and supports zoom.
3. The body is translucent enough to reveal internal anatomy without becoming a white silhouette.
4. The user can touch/click a supported organ and the selected organ is visually emphasized while the rest of the body remains visible.
5. The selected organ can be isolated and rotated independently in 360°.
6. The user can return from the isolated organ to the whole body without losing the selected clinical context.
7. The selected organ can switch between **Estado actual** and **Estado objetivo** with a visible state/color transition.
8. The clinical panel receives data for the selected organ and never fabricates unavailable measurements.
9. The prototype clearly marks VLI scores and biological ages as illustrative until the algorithm is clinically defined and validated.
10. The viewer keeps BodyParts3D attribution/licensing visible in the product credits.

## Visual target

The target is a premium clinical hologram rather than a literal copy of any concept image. The visual language is:

- dark navy / petroleum background;
- cyan-blue translucent body;
- visible internal anatomy;
- subtle edge glow and scan effect;
- selected organ in a strong clinical accent;
- orange/amber for altered current state;
- green/turquoise for target state;
- restrained particles and animated platform;
- no excessive bloom that destroys anatomical detail;
- the 3D body remains the protagonist of the screen.

## Supported organ map for v1

Core VLI clocks: Heart, Metabolism, Liver, Muscle, Brain.

Secondary anatomy: Kidneys and Pancreas when clinically useful and when data are available.

The first fully populated demo remains **Liver**, using only the known prototype values:

- fatty liver grade 2;
- AST 50 U/L;
- ALT 45 U/L;
- triglycerides 190 mg/dL;
- illustrative VLI hepatic score 52 → 86;
- illustrative hepatic biological age 57 → 51.

No additional laboratory values are assumed.

## What v1 deliberately does not promise

V1 does not promise cinematic/film-grade skin, vascular detail, or photorealistic tissue equivalent to a custom Blender asset. BodyParts3D remains the functional anatomical base. A later **VLI Visual v2** may replace or augment the visual mesh with a premium licensed 3D asset without changing the application data model.

## Freeze point

Once the ten acceptance criteria above work reliably, the 3D viewer is considered **functionally frozen for MVP**. Further visual polish becomes a separate track. Product development then moves to the application shell and clinical workflow.

# VLI™ App v1 — next phase

## Product flow

1. Authentication.
2. Patient list and VLI-ID.
3. New consultation.
4. Clinical / biochemical / imaging / body-composition data capture.
5. VLI Core Engine calculation.
6. Global VLI dashboard plus organ clocks.
7. Digital Twin Viewer using the same patient data.
8. Actual → Target comparison.
9. Clinical plan and objectives.
10. Longitudinal follow-up: Initial → Current → Target.
11. Patient report / Longevity Passport.
12. PDF and secure sharing workflow.

## Architecture

- **Frontend:** web-first responsive application; mobile-friendly.
- **3D module:** Three.js / WebGL, isolated as a reusable viewer component.
- **Backend:** Supabase.
- **Clinical engine:** versioned VLI Core Engine separated from presentation code.
- **Data contract:** patient → consultation → measurements → organ states → recommendations → follow-up.
- **Reports:** generated from the same structured data source, not manually duplicated.

## Scientific rule

Missing tests must not automatically penalize a patient. Every biomarker must have an evidence level, organ mapping, weight, and VLI version. Prototype scores/ages must remain visibly labelled as non-validated until scientific validation is completed.
