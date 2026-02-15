package com.tanmoy.praycounter;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.JavascriptInterface;
import android.content.Context;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.os.Build;
import android.media.AudioAttributes;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERMISSION_CODE = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebSettings webSettings = bridge.getWebView().getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);

        bridge.getWebView()
                .addJavascriptInterface(new WebAppInterface(), "AndroidApp");
    }

    // NOT static anymore
    public class WebAppInterface {

        // =========================
        // 🔔 VIBRATION
        // =========================
        @JavascriptInterface
        public void vibrate(int duration) {
            Vibrator v = (Vibrator)
                    MainActivity.this.getSystemService(Context.VIBRATOR_SERVICE);

            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    VibrationEffect effect =
                            VibrationEffect.createOneShot(
                                    duration,
                                    VibrationEffect.DEFAULT_AMPLITUDE
                            );

                    AudioAttributes audioAttributes =
                            new AudioAttributes.Builder()
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                    .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                                    .build();

                    v.vibrate(effect, audioAttributes);
                } else {
                    v.vibrate(duration);
                }
            }
        }

        // =========================
        // 🎤 MICROPHONE PERMISSION
        // =========================
        @JavascriptInterface
        public void requestMicPermission() {
            if (ContextCompat.checkSelfPermission(
                    MainActivity.this,
                    Manifest.permission.RECORD_AUDIO
            ) != PackageManager.PERMISSION_GRANTED) {

                ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{Manifest.permission.RECORD_AUDIO},
                        MIC_PERMISSION_CODE
                );
            }
        }
    }
}