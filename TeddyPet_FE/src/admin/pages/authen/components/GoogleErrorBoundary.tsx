import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GoogleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GoogleAuth ErrorBoundary] Caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box sx={{ p: 2, border: '1px dashed #FFAC82', borderRadius: 1, bgcolor: '#FFF5F2', textAlign: 'center' }}>
            <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                Tính năng đăng nhập Google hiện tại không khả dụng.
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
                Vui lòng sử dụng tài khoản/mật khẩu hệ thống.
            </Typography>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}
