package org.boidslab.tv;

// The whole native side of both TV apps: start the embedded relay serving
// this app's assets, point a fullscreen WebView at tv.html *via the TV's LAN
// address* (so the model's QR pairing hands phones a URL that actually
// works), and forward the TV remote's keys into the page. Everything else —
// the flock, the panel, the protocol — is the same HTML that runs everywhere
// else in this repo.

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.Random;

public abstract class TvActivity extends Activity {

    private static final int BASE_PORT = 8014;

    /** Page the WebView opens, with its panel flavour, e.g. "tv.html?panel=full". */
    protected abstract String startPage();
    /** Page the model's QR code sends phones to, e.g. "tablet.html". */
    protected abstract String pairPage();

    private RelayServer relay;
    private WebView web;
    private volatile boolean panelShown = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);

        String room = roomCode();
        relay = new RelayServer(this::readAsset, "/" + pairPage() + "?room=" + room);
        int port;
        try {
            port = relay.start(BASE_PORT);
        } catch (Exception e) {
            port = -1;   // no server: the flock still flies, pairing just won't reach phones
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#12100E"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0)
            WebView.setWebContentsDebuggingEnabled(true);
        web.addJavascriptInterface(new Bridge(), "TVBridge");
        setContentView(web);

        final int boundPort = port;
        String v = "";
        try { v = getPackageManager().getPackageInfo(getPackageName(), 0).versionName; }
        catch (Exception ignored) {}
        final String version = v;
        // the TV is usually already on the network; give a fresh boot a few
        // seconds to get an address before falling back to loopback
        new Thread(() -> {
            String ip = null;
            for (int i = 0; i < 8 && (ip = lanAddress()) == null; i++)
                try { Thread.sleep(500); } catch (InterruptedException ignored) {}
            final String host = ip != null ? ip : "127.0.0.1";
            runOnUiThread(() -> {
                if (boundPort < 0 || web == null) return;
                web.loadUrl("http://" + host + ":" + boundPort + "/" + startPage() +
                            "&room=" + room + "&pair=" + pairPage() +
                            "&v=" + version + "&autorun");
            });
        }, "find-lan-ip").start();
    }

    @Override
    protected void onDestroy() {
        if (relay != null) relay.stop();
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }

    // ---- the TV remote ------------------------------------------------------
    // Every key the page cares about is delivered by name to window.__tv.key()
    // (tv.html). BACK closes the panel when it is open and leaves the app when
    // it is not; everything unrecognised stays with the system.

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        String name = keyName(e.getKeyCode());
        if (name == null) return super.dispatchKeyEvent(e);
        if (name.equals("Back") && !panelShown) return super.dispatchKeyEvent(e);
        if (e.getAction() == KeyEvent.ACTION_DOWN && web != null)
            web.evaluateJavascript("window.__tv&&__tv.key('" + name + "')", null);
        return true;
    }

    private static String keyName(int code) {
        switch (code) {
            case KeyEvent.KEYCODE_DPAD_UP: return "Up";
            case KeyEvent.KEYCODE_DPAD_DOWN: return "Down";
            case KeyEvent.KEYCODE_DPAD_LEFT: return "Left";
            case KeyEvent.KEYCODE_DPAD_RIGHT: return "Right";
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_NUMPAD_ENTER: return "Enter";
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PAUSE: return "PlayPause";
            case KeyEvent.KEYCODE_MENU: return "Menu";
            case KeyEvent.KEYCODE_BACK: return "Back";
            default: return null;
        }
    }

    private final class Bridge {
        @JavascriptInterface
        public void panelState(boolean shown) { panelShown = shown; }
    }

    // ---- plumbing -------------------------------------------------------------

    private byte[] readAsset(String path) {
        try (InputStream in = getAssets().open(path)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }

    /** One room code per install, so a bookmarked phone remote keeps working. */
    private String roomCode() {
        SharedPreferences prefs = getPreferences(Context.MODE_PRIVATE);
        String room = prefs.getString("room", null);
        if (room == null) {
            String alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
            Random rnd = new Random();
            StringBuilder b = new StringBuilder();
            for (int i = 0; i < 4; i++) b.append(alphabet.charAt(rnd.nextInt(alphabet.length())));
            room = b.toString();
            prefs.edit().putString("room", room).apply();
        }
        return room;
    }

    private static String lanAddress() {
        try {
            Enumeration<NetworkInterface> nics = NetworkInterface.getNetworkInterfaces();
            while (nics != null && nics.hasMoreElements()) {
                NetworkInterface nic = nics.nextElement();
                if (!nic.isUp() || nic.isLoopback()) continue;
                Enumeration<InetAddress> addrs = nic.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress a = addrs.nextElement();
                    if (a instanceof Inet4Address && !a.isLoopbackAddress() && a.isSiteLocalAddress())
                        return a.getHostAddress();
                }
            }
        } catch (Exception ignored) {}
        return null;
    }
}
