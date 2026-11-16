/** Match every admin URL while leaving the sign-in page public. */
export function isAdminProtectedPath(pathname: string) {
	return (pathname === '/admin' || pathname.startsWith('/admin/')) && pathname !== '/admin/login';
}
