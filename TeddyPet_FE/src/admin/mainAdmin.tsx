import { StrictMode } from 'react'
import { AxiosError } from 'axios'
import {
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Styles
import './styles/index.css'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // eslint-disable-next-line no-console
                if (import.meta.env.DEV) console.log({ failureCount, error })

                if (failureCount >= 0 && import.meta.env.DEV) return false
                if (failureCount > 3 && import.meta.env.PROD) return false

                return !(
                    error instanceof AxiosError &&
                    [401, 403].includes(error.response?.status ?? 0)
                )
            },
            refetchOnWindowFocus: import.meta.env.PROD,
            staleTime: 10 * 1000, // 10s
        },
        mutations: {
            onError: (error) => {
                if (error instanceof AxiosError) {
                    const status = error.response?.status;
                    
                    if (status === 304) {
                        toast.error('Content not modified!')
                    } else if (status === 401) {
                        toast.error('Unauthorized!')
                    } else if (status === 500) {
                        toast.error('Internal Server Error!')
                    }
                }
            },
        },
    },
    queryCache: new QueryCache({
        onError: (error) => {
            if (error instanceof AxiosError) {
                const status = error.response?.status;
                
                if (status === 401) {
                    toast.error('Session expired!')
                } else if (status === 500) {
                    toast.error('Internal Server Error!')
                } else if (status === 403) {
                    toast.error('Forbidden!')
                }
            }
        },
    }),
})

// COMPONENT ADMIN APP BỌC - Export QueryClient để sử dụng ở App.tsx
export { queryClient }

export function AdminProviders({ children }: { children: React.ReactNode }) {
    return (
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <FontProvider>
                        {children}
                    </FontProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </StrictMode>
    )
}