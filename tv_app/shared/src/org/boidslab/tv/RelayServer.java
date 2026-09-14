package org.boidslab.tv;

// A line-for-line-in-spirit Java port of relay.js: static file server +
// WebSocket message relay, one class, zero dependencies. Inside the TV apps
// it serves the WebView's own assets to every browser on the LAN and relays
// ws://<tv>:<port>/ws/<room>; on a desktop JVM (DesktopRelayMain) the same
// class passes the same test suite as relay.js. The relay is dumb on
// purpose: it forwards every message to every *other* socket in the same
// room and understands nothing about the protocol. The model stays the
// single source of truth (docs/instrument-protocol.md).

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RelayServer {

    /** Where static files come from: Android assets in the apps, plain directories on desktop. */
    public interface Assets {
        byte[] open(String path);   // null = not found
    }

    private static final int MAX_MSG = 64 * 1024 * 1024;
    private static final Pattern WS_PATH = Pattern.compile("^/ws/([\\w-]{1,32})$");
    private static final String WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    private static final Map<String, String> MIME = new HashMap<>();
    static {
        MIME.put(".html", "text/html; charset=utf-8");
        MIME.put(".js", "text/javascript; charset=utf-8");
        MIME.put(".css", "text/css; charset=utf-8");
        MIME.put(".md", "text/plain; charset=utf-8");
        MIME.put(".json", "application/json");
        MIME.put(".png", "image/png");
        MIME.put(".svg", "image/svg+xml");
    }

    private final Assets assets;
    private final String indexPath;   // what "/" serves (or redirects to, if it has a query)
    private final Map<String, Set<Peer>> rooms = new ConcurrentHashMap<>();
    private ServerSocket server;
    private Thread acceptor;
    private int boundPort = -1;

    public RelayServer(Assets assets, String indexPath) {
        this.assets = assets;
        this.indexPath = indexPath == null ? "/index.html" : indexPath;
    }

    /** Bind the first free port in [port, port+9]; returns the bound port. */
    public synchronized int start(int port) throws IOException {
        IOException last = null;
        for (int p = port; p < port + 10; p++) {
            try { server = new ServerSocket(p); last = null; break; }
            catch (IOException e) { last = e; }
        }
        if (last != null) throw last;
        boundPort = server.getLocalPort();
        acceptor = new Thread(() -> {
            while (!server.isClosed()) {
                try {
                    Socket s = server.accept();
                    Thread t = new Thread(() -> serve(s));
                    t.setDaemon(true);
                    t.start();
                } catch (IOException e) { break; }
            }
        }, "relay-accept");
        acceptor.setDaemon(true);
        acceptor.start();
        return boundPort;
    }

    public synchronized void stop() {
        try { if (server != null) server.close(); } catch (IOException ignored) {}
        for (Set<Peer> peers : rooms.values())
            for (Peer p : peers) p.destroy();
        rooms.clear();
    }

    public int port() { return boundPort; }

    // ---- per-connection ----------------------------------------------------

    private void serve(Socket sock) {
        try {
            sock.setTcpNoDelay(true);
            InputStream in = sock.getInputStream();
            OutputStream out = sock.getOutputStream();
            String head = readHead(in);
            if (head == null) { sock.close(); return; }
            String[] lines = head.split("\r\n");
            String[] req = lines[0].split(" ");
            if (req.length < 2) { sock.close(); return; }
            String target = req[1];
            Map<String, String> headers = new HashMap<>();
            for (int i = 1; i < lines.length; i++) {
                int c = lines[i].indexOf(':');
                if (c > 0) headers.put(lines[i].substring(0, c).trim().toLowerCase(),
                                       lines[i].substring(c + 1).trim());
            }
            Matcher ws = WS_PATH.matcher(target);
            String key = headers.get("sec-websocket-key");
            if (ws.matches() && key != null) websocket(sock, in, out, ws.group(1), key);
            else { httpReply(out, target); sock.close(); }
        } catch (Exception e) {
            try { sock.close(); } catch (IOException ignored) {}
        }
    }

    private static String readHead(InputStream in) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        int state = 0;   // counts through \r\n\r\n
        while (b.size() < 16384) {
            int c = in.read();
            if (c < 0) return null;
            b.write(c);
            if (c == '\r' && (state == 0 || state == 2)) state++;
            else if (c == '\n' && (state == 1 || state == 3)) state++;
            else state = 0;
            if (state == 4) return new String(b.toByteArray(), StandardCharsets.ISO_8859_1);
        }
        return null;
    }

    // ---- static files --------------------------------------------------------

    private void httpReply(OutputStream out, String target) throws IOException {
        String path;
        try {
            int q = target.indexOf('?');
            path = java.net.URLDecoder.decode(q >= 0 ? target.substring(0, q) : target, "UTF-8");
        } catch (Exception e) { simple(out, "400 Bad Request", ""); return; }
        if (path.equals("/")) {
            if (indexPath.indexOf('?') >= 0) {   // a paired start page: redirect so the URL bar shows it
                out.write(("HTTP/1.1 302 Found\r\nLocation: " + indexPath +
                           "\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
                          .getBytes(StandardCharsets.ISO_8859_1));
                out.flush();
                return;
            }
            path = indexPath;
        }
        if (path.contains("..")) { simple(out, "403 Forbidden", ""); return; }
        byte[] data = assets.open(path.startsWith("/") ? path.substring(1) : path);
        if (data == null) { simple(out, "404 Not Found", "not found"); return; }
        int dot = path.lastIndexOf('.');
        String mime = dot >= 0 ? MIME.get(path.substring(dot).toLowerCase()) : null;
        if (mime == null) mime = "application/octet-stream";
        out.write(("HTTP/1.1 200 OK\r\nContent-Type: " + mime +
                   "\r\nContent-Length: " + data.length + "\r\nConnection: close\r\n\r\n")
                  .getBytes(StandardCharsets.ISO_8859_1));
        out.write(data);
        out.flush();
    }

    private static void simple(OutputStream out, String status, String body) throws IOException {
        byte[] b = body.getBytes(StandardCharsets.UTF_8);
        out.write(("HTTP/1.1 " + status + "\r\nContent-Type: text/plain\r\nContent-Length: " +
                   b.length + "\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.ISO_8859_1));
        out.write(b);
        out.flush();
    }

    // ---- websocket relay -----------------------------------------------------

    private static final class Peer {
        final Socket sock;
        final OutputStream out;
        Peer(Socket s, OutputStream o) { sock = s; out = o; }
        void write(byte[] frame) {
            synchronized (this) {
                try { out.write(frame); out.flush(); }
                catch (IOException e) { destroy(); }
            }
        }
        void destroy() { try { sock.close(); } catch (IOException ignored) {} }
    }

    private void websocket(Socket sock, InputStream in, OutputStream out, String room, String key)
            throws Exception {
        MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
        String accept = Base64.getEncoder().encodeToString(
                sha1.digest((key + WS_GUID).getBytes(StandardCharsets.ISO_8859_1)));
        out.write(("HTTP/1.1 101 Switching Protocols\r\n" +
                   "Upgrade: websocket\r\nConnection: Upgrade\r\n" +
                   "Sec-WebSocket-Accept: " + accept + "\r\n\r\n")
                  .getBytes(StandardCharsets.ISO_8859_1));
        out.flush();

        Set<Peer> peers = rooms.computeIfAbsent(room, r -> new CopyOnWriteArraySet<>());
        Peer me = new Peer(sock, out);
        peers.add(me);

        int fragOp = -1;
        List<byte[]> fragParts = new ArrayList<>();
        try {
            while (true) {
                int b0 = in.read(), b1 = in.read();
                if (b0 < 0 || b1 < 0) break;
                boolean fin = (b0 & 0x80) != 0;
                int op = b0 & 0x0f;
                boolean masked = (b1 & 0x80) != 0;
                long len = b1 & 0x7f;
                if (len == 126) len = ((long) mustRead(in) << 8) | mustRead(in);
                else if (len == 127) {
                    len = 0;
                    for (int i = 0; i < 8; i++) len = (len << 8) | mustRead(in);
                }
                if (len > MAX_MSG || len < 0) break;
                byte[] mask = null;
                if (masked) {
                    mask = new byte[4];
                    readFully(in, mask);
                }
                byte[] payload = new byte[(int) len];
                readFully(in, payload);
                if (mask != null)
                    for (int i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];

                if (op == 8) break;
                else if (op == 9) me.write(encodeFrame(payload, 10));
                else if (op == 10) { /* pong */ }
                else if (op == 1 || op == 2) {
                    if (fin) deliver(peers, me, payload, op);
                    else { fragOp = op; fragParts.clear(); fragParts.add(payload); }
                } else if (op == 0) {
                    if (fragOp < 0) break;   // stray continuation
                    fragParts.add(payload);
                    if (fin) {
                        int total = 0;
                        for (byte[] part : fragParts) total += part.length;
                        if (total > MAX_MSG) break;
                        byte[] whole = new byte[total];
                        int off = 0;
                        for (byte[] part : fragParts) {
                            System.arraycopy(part, 0, whole, off, part.length);
                            off += part.length;
                        }
                        deliver(peers, me, whole, fragOp);
                        fragOp = -1;
                        fragParts.clear();
                    }
                }
            }
        } finally {
            peers.remove(me);
            me.destroy();
            rooms.computeIfPresent(room, (r, set) -> set.isEmpty() ? null : set);
        }
    }

    private static void deliver(Set<Peer> peers, Peer from, byte[] payload, int op) {
        byte[] frame = encodeFrame(payload, op);
        for (Peer p : peers) if (p != from) p.write(frame);
    }

    private static byte[] encodeFrame(byte[] payload, int op) {
        int len = payload.length;
        byte[] head;
        if (len < 126) head = new byte[]{(byte) (0x80 | op), (byte) len};
        else if (len < 65536) head = new byte[]{(byte) (0x80 | op), 126, (byte) (len >> 8), (byte) len};
        else {
            head = new byte[10];
            head[0] = (byte) (0x80 | op); head[1] = 127;
            long l = len;
            for (int i = 9; i >= 2; i--) { head[i] = (byte) l; l >>= 8; }
        }
        byte[] frame = new byte[head.length + len];
        System.arraycopy(head, 0, frame, 0, head.length);
        System.arraycopy(payload, 0, frame, head.length, len);
        return frame;
    }

    private static int mustRead(InputStream in) throws IOException {
        int c = in.read();
        if (c < 0) throw new IOException("eof");
        return c;
    }

    private static void readFully(InputStream in, byte[] buf) throws IOException {
        int off = 0;
        while (off < buf.length) {
            int n = in.read(buf, off, buf.length - off);
            if (n < 0) throw new IOException("eof");
            off += n;
        }
    }
}
