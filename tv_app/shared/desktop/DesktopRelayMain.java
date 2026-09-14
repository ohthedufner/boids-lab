// Desktop runner for the embedded TV relay — lets the repo's WebSocket test
// suite exercise the exact class the Android apps ship, no device needed:
//
//   javac -d out shared/src/org/boidslab/tv/RelayServer.java shared/desktop/DesktopRelayMain.java
//   java -cp out DesktopRelayMain 8077 <dir> [<dir>...]
//
// Static files resolve against the given directories in order, which mirrors
// how the apps' Gradle copy task flattens repo pages and tv_app/web pages
// into one assets folder. Compiled by test/tv-relay-test.js, not by Gradle.

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.boidslab.tv.RelayServer;

public class DesktopRelayMain {
    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(args[0]);
        Path[] dirs = new Path[args.length - 1];
        for (int i = 1; i < args.length; i++) dirs[i - 1] = Paths.get(args[i]);

        RelayServer relay = new RelayServer(path -> {
            if (path.contains("..")) return null;
            for (Path dir : dirs) {
                Path f = dir.resolve(path).normalize();
                if (f.startsWith(dir) && Files.isRegularFile(f)) {
                    try { return Files.readAllBytes(f); } catch (IOException e) { return null; }
                }
            }
            return null;
        }, "/index.html");

        int bound = relay.start(port);
        System.out.println("boids tv relay listening on port " + bound);
        System.out.flush();
        // the accept loop runs on a daemon thread; hold the JVM open
        try { Thread.currentThread().join(); } catch (InterruptedException ignored) {}
    }
}
