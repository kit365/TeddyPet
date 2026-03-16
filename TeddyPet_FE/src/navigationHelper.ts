/**
 * Cho phép API interceptor chuyển hướng sang login bằng React Router (không reload trang).
 * App gọi setNavigateToLogin(navigate) khi mount; interceptor gọi redirectToLogin(path).
 */
let navigateToLogin: ((path: string) => void) | null = null;

export function setNavigateToLogin(fn: (path: string) => void): void {
    navigateToLogin = fn;
}

export function clearNavigateToLogin(): void {
    navigateToLogin = null;
}

export function redirectToLogin(path: string): void {
    if (navigateToLogin) {
        navigateToLogin(path);
    } else {
        window.location.href = path;
    }
}
