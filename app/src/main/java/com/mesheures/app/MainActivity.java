package com.mesheures.app;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.webkit.*;
import android.view.*;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.util.*;

public class MainActivity extends Activity {
    private WebView web;
    private static final int FILE_PICKER=42;
    private ValueCallback<Uri[]> uploadCallback;
    @Override public void onCreate(Bundle b){ super.onCreate(b); getWindow().setStatusBarColor(0xFF07100D); getWindow().setNavigationBarColor(0xFF07100D);
        web=new WebView(this); setContentView(web); setupWebView();
        if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},77);
        web.loadUrl("file:///android_asset/web/index.html");
    }
    private void setupWebView(){
        WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true); s.setAllowFileAccess(true); s.setAllowContentAccess(true); s.setMediaPlaybackRequiresUserGesture(false); s.setBuiltInZoomControls(false); s.setDisplayZoomControls(false); s.setSupportZoom(false);
        web.setBackgroundColor(0xFF07100D); web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p){ uploadCallback=cb; Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT); i.addCategory(Intent.CATEGORY_OPENABLE); i.setType("*/*"); startActivityForResult(i,FILE_PICKER); return true; }
        });
        web.addJavascriptInterface(new AndroidBridge(this),"MesHeuresAndroid");
    }
    @Override protected void onActivityResult(int r,int c,Intent d){ super.onActivityResult(r,c,d); if(r==FILE_PICKER && uploadCallback!=null){ uploadCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(c,d)); uploadCallback=null; } }
    @Override public void onBackPressed(){ if(web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    public class AndroidBridge { Context c; AndroidBridge(Context x){c=x;}
        @JavascriptInterface public String platform(){return "android";}
        @JavascriptInterface public String version(){return "16.1.0";}
        @JavascriptInterface public void toast(String msg){runOnUiThread(()->Toast.makeText(c,msg,Toast.LENGTH_SHORT).show());}
        @JavascriptInterface public void openSettings(){ startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:"+getPackageName()))); }
        @JavascriptInterface public void requestCamera(){ if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{Manifest.permission.CAMERA},78); }
        @JavascriptInterface public boolean cameraGranted(){ return Build.VERSION.SDK_INT<23 || checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED; }
    }
}
