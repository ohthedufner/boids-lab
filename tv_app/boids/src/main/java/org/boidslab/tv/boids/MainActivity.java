package org.boidslab.tv.boids;

import org.boidslab.tv.TvActivity;

// TV Boids: the same model, controls trimmed to the original toy's set —
// presets, the three rules, vision, speed, flock size, trails. The QR pairs
// a phone to the matching lite remote.
public class MainActivity extends TvActivity {
    @Override protected String startPage() { return "tv.html?panel=lite"; }
    @Override protected String pairPage() { return "remote-lite.html"; }
}
