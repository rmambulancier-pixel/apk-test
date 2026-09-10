package com.mesheures.app;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends Activity {

    private WebView web;
    private static final int FILE_PICKER = 42;
    private ValueCallback<Uri[]> uploadCallback;

    private static final String PREFS = "mesheures_android_backup";
    private static final String STORAGE_KEY = "local_storage_snapshot";
    private SharedPreferences backupPrefs;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);

        backupPrefs = getSharedPreferences(PREFS, MODE_PRIVATE);

        // Android 15 / targetSdk 35 : gestion correcte des zones système.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(0xFF07100D);
        getWindow().setNavigationBarColor(0xFF07100D);

        web = new WebView(this);
        web.setBackgroundColor(0xFF07100D);

        ViewCompat.setOnApplyWindowInsetsListener(web, (view, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
            );

            view.setPadding(
                bars.left,
                bars.top,
                bars.right,
                bars.bottom
            );

            return insets;
        });

        setContentView(web);
        setupWebView();

        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                new String[]{Manifest.permission.POST_NOTIFICATIONS}, 77
            );
        }

        web.loadUrl("file:///android_asset/web/index.html");
    }

    private void setupWebView() {
        WebSettings s = web.getSettings();

        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                // Restaure la dernière sauvegarde Android avant toute utilisation.
                restoreLocalStorage();

                // Sauvegarde périodique automatique toutes les 30 secondes.
                installAutoBackup();
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView v,
                    ValueCallback<Uri[]> cb,
                    FileChooserParams p) {

                uploadCallback = cb;

                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");

                startActivityForResult(i, FILE_PICKER);
                return true;
            }
        });

        web.addJavascriptInterface(
            new AndroidBridge(this),
            "MesHeuresAndroid"
        );
    }

    /**
     * Installe une sauvegarde régulière du localStorage.
     * Cela protège les données même si Android tue ensuite le processus.
     */
    private void installAutoBackup() {
        String js =
            "(function(){"
          + "if(window.__mesHeuresBackupInstalled)return;"
          + "window.__mesHeuresBackupInstalled=true;"
          + "function save(){"
          + "try{"
          + "var o={};"
          + "for(var i=0;i<localStorage.length;i++){"
          + "var k=localStorage.key(i);"
          + "o[k]=localStorage.getItem(k);"
          + "}"
          + "if(window.MesHeuresAndroid)"
          + "window.MesHeuresAndroid.saveLocalStorage(JSON.stringify(o));"
          + "}catch(e){}"
          + "}"
          + "setTimeout(save,3000);"
          + "setInterval(save,30000);"
          + "document.addEventListener('visibilitychange',function(){"
          + "if(document.visibilityState==='hidden')save();"
          + "});"
          + "window.addEventListener('pagehide',save);"
          + "})();";

        web.evaluateJavascript(js, null);
    }

    /**
     * Réinjecte la sauvegarde Android dans le localStorage du WebView.
     */
    private void restoreLocalStorage() {
        String snapshot = backupPrefs.getString(STORAGE_KEY, null);
        if (snapshot == null || snapshot.isEmpty()) {
            return;
        }

        String escaped = snapshot
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\u2028", "\\u2028")
                .replace("\u2029", "\\u2029");

        String js =
            "(function(){"
          + "try{"
          + "var o=JSON.parse('" + escaped + "');"
          + "Object.keys(o).forEach(function(k){"
          + "if(localStorage.getItem(k)===null && o[k]!==null)"
          + "localStorage.setItem(k,o[k]);"
          + "});"
          + "}catch(e){}"
          + "})();";

        web.evaluateJavascript(js, null);
    }

    @Override
    protected void onPause() {
        saveWebViewStorage();
        super.onPause();
    }

    @Override
    protected void onStop() {
        saveWebViewStorage();
        super.onStop();
    }

    /**
     * Demande une sauvegarde immédiate avant que l'activité ne soit arrêtée.
     */
    private void saveWebViewStorage() {
        if (web == null) return;

        String js =
            "(function(){"
          + "try{"
          + "var o={};"
          + "for(var i=0;i<localStorage.length;i++){"
          + "var k=localStorage.key(i);"
          + "o[k]=localStorage.getItem(k);"
          + "}"
          + "if(window.MesHeuresAndroid)"
          + "window.MesHeuresAndroid.saveLocalStorage(JSON.stringify(o));"
          + "}catch(e){}"
          + "})();";

        web.evaluateJavascript(js, null);
    }

    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data) {

        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == FILE_PICKER && uploadCallback != null) {
            uploadCallback.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(
                    resultCode, data
                )
            );
            uploadCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    public class AndroidBridge {

        private final Context c;

        AndroidBridge(Context x) {
            c = x;
        }

        @JavascriptInterface
        public String platform() {
            return "android";
        }

        @JavascriptInterface
        public String version() {
            return "16.1.0";
        }

        /**
         * Reçoit une copie complète du localStorage et la conserve
         * dans le stockage privé Android.
         */
        @JavascriptInterface
        public void saveLocalStorage(String json) {
            if (json == null) return;

            backupPrefs.edit()
                .putString(STORAGE_KEY, json)
                .apply();
        }

        @JavascriptInterface
        public void toast(String msg) {
            runOnUiThread(() ->
                Toast.makeText(c, msg, Toast.LENGTH_SHORT).show()
            );
        }

        @JavascriptInterface
        public void openSettings() {
            startActivity(new Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:" + getPackageName())
            ));
        }

        @JavascriptInterface
        public void requestCamera() {
            if (Build.VERSION.SDK_INT >= 23
                    && checkSelfPermission(Manifest.permission.CAMERA)
                    != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(
                    new String[]{Manifest.permission.CAMERA}, 78
                );
            }
        }

        @JavascriptInterface
        public boolean cameraGranted() {
            return Build.VERSION.SDK_INT < 23
                    || checkSelfPermission(Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED;
        }
    }
}
