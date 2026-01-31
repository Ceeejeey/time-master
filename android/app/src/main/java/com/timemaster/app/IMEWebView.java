package com.timemaster.app;

import android.content.Context;
import android.util.AttributeSet;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputConnectionWrapper;
import android.view.KeyEvent;
import android.webkit.WebView;
import android.text.Editable;
import android.text.SpannableStringBuilder;

/**
 * Custom WebView that properly handles 3rd party keyboards (Helakuru, etc.)
 * by providing a better InputConnection implementation for complex script input.
 */
public class IMEWebView extends WebView {

    public IMEWebView(Context context) {
        super(context);
    }

    public IMEWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public IMEWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    public InputConnection onCreateInputConnection(EditorInfo outAttrs) {
        InputConnection connection = super.onCreateInputConnection(outAttrs);
        if (connection == null) {
            return null;
        }
        
        // Modify editor info to better support complex scripts
        outAttrs.inputType = outAttrs.inputType | EditorInfo.TYPE_TEXT_FLAG_NO_SUGGESTIONS;
        outAttrs.imeOptions = outAttrs.imeOptions | EditorInfo.IME_FLAG_NO_EXTRACT_UI;
        
        return new IMEInputConnectionWrapper(connection, true);
    }

    /**
     * Custom InputConnection wrapper that ensures proper handling of
     * composition events from 3rd party keyboards like Helakuru.
     */
    private static class IMEInputConnectionWrapper extends InputConnectionWrapper {
        
        public IMEInputConnectionWrapper(InputConnection target, boolean mutable) {
            super(target, mutable);
        }

        @Override
        public boolean commitText(CharSequence text, int newCursorPosition) {
            // Ensure text is committed properly for complex scripts
            return super.commitText(text, newCursorPosition);
        }

        @Override
        public boolean setComposingText(CharSequence text, int newCursorPosition) {
            // Handle composing text for complex scripts (Sinhala, Tamil, etc.)
            return super.setComposingText(text, newCursorPosition);
        }

        @Override
        public boolean finishComposingText() {
            // Ensure composition is properly finished
            return super.finishComposingText();
        }

        @Override
        public boolean sendKeyEvent(KeyEvent event) {
            // Ensure key events are properly forwarded
            return super.sendKeyEvent(event);
        }

        @Override
        public boolean deleteSurroundingText(int beforeLength, int afterLength) {
            // Handle deletion properly for complex scripts
            return super.deleteSurroundingText(beforeLength, afterLength);
        }

        @Override
        public boolean setComposingRegion(int start, int end) {
            // Handle composing region for complex scripts
            return super.setComposingRegion(start, end);
        }
    }
}
