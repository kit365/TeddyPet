import { memo } from 'react';
import { GoogleLogin } from "@react-oauth/google";
import { GoogleErrorBoundary } from "./GoogleErrorBoundary";
import { Box } from "@mui/material";

interface SafeGoogleLoginProps {
    onSuccess: (credential: string) => void;
    onError: () => void;
    disabled?: boolean;
}

/**
 * SafeGoogleLogin isolates the Google Login button to prevent external library
 * initialization errors from crashing the entire Login Page.
 */
export const SafeGoogleLogin = memo(({ onSuccess, onError, disabled }: SafeGoogleLoginProps) => {
    return (
        <GoogleErrorBoundary>
            <Box 
                sx={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'center',
                    minHeight: '40px', // Prevent layout shift if it fails to load
                    opacity: disabled ? 0.6 : 1,
                    pointerEvents: disabled ? 'none' : 'auto',
                }}
            >
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        try {
                            if (credentialResponse.credential) {
                                onSuccess(credentialResponse.credential);
                            } else {
                                console.warn('[SafeGoogleLogin] No credential received');
                                onError();
                            }
                        } catch (err) {
                            console.error('[SafeGoogleLogin] Success handler crashed:', err);
                            onError();
                        }
                    }}
                    onError={() => {
                        console.error('[SafeGoogleLogin] Google library reported error');
                        onError();
                    }}
                    useOneTap={false} // OneTap is often the cause of intrusive loops/popups if configured wrongly
                />
            </Box>
        </GoogleErrorBoundary>
    );
});

SafeGoogleLogin.displayName = 'SafeGoogleLogin';
