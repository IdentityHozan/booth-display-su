# CIMP Partners Studio

A private, hosted TV playlist and control studio built with React, Vinext and Cloudflare R2.

## Use
Open `/admin` on your control device, and `/` (or `/display`) on the TV-connected computer. Both browsers must be signed into the owner's ChatGPT account. The TV automatically starts the broadcast opening. Press F or use Full screen to enter fullscreen. Press R to replay the opening. The display has no visible toolbar. Playback controls and the source-code download are in `/admin`. Audio is on by default. If browser autoplay policy blocks sound, playback falls back to muted with a small Turn sound on control that dismisses after six seconds. Click once on the TV to unlock sound. Admin mute and the M shortcut remain available. Upload the real montage through Video, edit slides, and Publish changes. Settings and commands poll every three seconds. The preview shows the selected slide, not the TV's exact playback position.

The original loading and opening timeline is preserved. Choose Light or Dark in Display settings. Transition speed controls a continuous, logo-free diagonal stinger (0.8 seconds by default). The outgoing scene stays visible until the opaque midpoint, when the next scene mounts, then the same panel reveals it. Intro announcements are suppressed to preserve the opening. The playlist supports animated branding, messages, full-duration videos and timed images. MP4 (H.264/AAC recommended) and WebM uploads use 8 MB multipart requests, up to 1 GB. Files remain in R2 when removed from the playlist, so removing a slide is not a permanent asset deletion. Direct HTTPS media URLs must be playable media, not YouTube or Drive sharing pages.

An existing loaded playlist continues if control polling fails. This is not a fully offline application: uncached videos still require a connection. Browser screen wake lock is requested where supported; the physical TV's power-saving settings remain external. Verify the actual TV, browser, Wi-Fi and montage before the event.

## Access boundary
The Site is owner-private. Sites authenticates requests before the application, including media and write APIs. The shared state endpoint intentionally relies on that boundary and rejects cross-origin writes. **Do not change this site to public without implementing explicit server-side write authorization.** No tokens or passwords are embedded in the client.

## Assets and content
The Sunway College logo was downloaded from the official website: https://sunwaycollege.edu.my/themes/contrib/osb5/sunway_college_logo.png
The CIMP lettering is a typographic treatment, not a verified standalone official programme logo. It can be replaced through the intro artwork upload.
Initial programme statements are sourced from https://sunwaycollege.edu.my/programmes/pre-university-foundation/canadian-international-matriculation-programme (accessed 6 November 2026). The default event name is editable. No montage was supplied or fabricated.

## Validation
`node --experimental-strip-types --test tests/model.test.mjs`
`node node_modules/typescript/bin/tsc --noEmit`
Build using the Sites build helper. Local browser QA verified publishing, launching the display, pause/resume, restart, and next-slide commands between two tabs. A generated H.264/AAC test clip verified muted autoplay fallback and successful unmuted playback after the sound control. Actual physical TV audio output still requires the event hardware.

## Source download
The admin page links to `/source.zip`. Regenerate it after edits with `python scripts/export-source.py` before building. It includes application source, assets, dependency locks, configuration and tests. It excludes credentials, Git history, uploads, runtime state, dependencies and build output. Media source URLs are editable and copyable in the slide editor.

## Branding and playback refinements
Sunway's white-lettered artwork is extracted from the official CIMP Student Guide 2025: https://sunwaycollege.edu.my/sites/default/files/inline-images/pdfs/cimp-guide-2025.pdf. Lettering and tagline use the original vector paths; the crest uses the embedded official image, converted to RGB with a white-background key in SVG. The generated cutout was rejected and is not deployed. The maple-leaf geometry is the public-domain Wikimedia Commons flag-leaf asset: https://commons.wikimedia.org/wiki/File:Flag_of_Canada_(leaf).svg. The CIMP-plus-leaf treatment is a custom presentation mark, not an assertion of an official programme logo.

Announcements have a global Show bottom message switch and a separate Also show over videos switch (off by default, including older configurations). Hold keeps the selected non-video slide and replays its entrance every slide duration. Video pause remains conventional. There are no separate pre-exit fades.

## Photo collections
Add Photos in admin, upload multiple PNG/JPG/WebP files or add image URLs. A slide supports up to 60 photos. Choose Single photo, Collage (2, 3, 4 or 6 per page), or Slideshow. Set the change interval from 2 to 30 seconds and choose Fill frame or Show entire photo. Reorder, remove, or edit individual source URLs. Collage and slideshow durations extend automatically to show every photo before advancing. Existing single-image slides keep working. Collage pages adapt to the remaining photo count. Pausing the playlist keeps internal photo cycling active.

Message slides now use a dark editorial layout with a softly moving maple backdrop, white Sunway artwork and red accents. The intro lettering is centred independently of its companion leaf; its original entrance timeline is retained.

Photo collections share the display theme, event header, caption and transparent Sunway logo. The photos remain framed within the branded slide. Image preparation loads the next page/slide in advance. The old opacity setting remains accepted for backwards compatibility but is no longer exposed or used by scene transitions.

Each photo has optional individual Fit/Fill, scale (50–300%), and horizontal/vertical framing (0–100%) controls. Expand Adjust photo to keep its collage page visible in the admin preview, reset its framing, or replace its uploaded image. Reordering and removing photos preserves the association between each photo and its framing settings. Photo slides have separate caption and bottom-announcement visibility switches; hiding them expands the photo area. Light mode uses ivory surfaces, dark lettering, pale photo mats, and a light announcement banner. Intro lettering stays centred with a smaller adjacent leaf and an oversized left-offset background wordmark.

A demonstration Photo collection slide with six numbered SVG placeholders is added once to existing playlists (when below the 40-slide limit), and is included in new defaults. It starts as a three-photo collage with two pages. Replace placeholders through Adjust photo; removing the sample and publishing keeps it removed.

Transition repair: scene and wipe elements use separately namespaced React keys. The screen swap no longer collides with the overlay identity. Only the moving panel animates; completion removes the overlay, with a delayed cleanup fallback. Browser QA reproduced the previous duplicate-key warning, then verified consecutive scene changes without new duplicate-key errors and no remaining overlay.

Message headers now include the full programme name beneath CIMP. Video slides use the same themed programme header, bordered media frame, title/caption and Sunway footer as photo slides. A silent 12-second H.264 sample motion graphic is added once to existing playlists with capacity and included in defaults; replace it through Upload video. It is labelled SAMPLE VIDEO and contains no fabricated event footage. Browser QA verified loaded duration and playing state in the admin preview.
