package org.boidslab.tv.lab;

import org.boidslab.tv.TvActivity;

// Boids Lab TV: the full instrument. The on-TV panel carries clock, presets,
// and the live sliders; the QR pairs a phone or tablet to tablet.html — the
// whole control room, served by the TV itself.
public class MainActivity extends TvActivity {
    @Override protected String startPage() { return "tv.html?panel=full"; }
    @Override protected String pairPage() { return "tablet.html"; }
}
