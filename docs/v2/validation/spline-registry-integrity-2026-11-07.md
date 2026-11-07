# Spline registry integrity — 2026-11-07

The module registry rejects empty, malformed and duplicate Spline object IDs,
including collisions between module surfaces and their label/indicator hit IDs.
Modules without Spline metadata remain supported. The selection resolver only
accepts a real array of hit IDs and still rejects ambiguous or unavailable
modules.

Validation in the existing working tree: Spline selection and framing contract
tests passed; V2 application tests passed 315 assertions; spatial universe tests
passed 238 assertions; oxlint completed with existing warnings; Vite production
build and PWA service-worker generation completed. The working tree included
unrelated dependency and asset changes, so this is not clean-release evidence.

The additional hit IDs refer to the editable Spline scene. They are not proof
that the current hosted export emits those events. The 30-point canvas test
remains failing against that export; no production deployment was made.
