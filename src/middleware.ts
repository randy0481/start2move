import { sequence } from 'astro/middleware';

export const onRequest = sequence(
  async ({ url, redirect }, next) => {
    // Redirect root to /blog
    if (url.pathname === '/') {
      return redirect('/blog', 301);
    }
    
    // Ensure all blog routes are under /blog
    if (!url.pathname.startsWith('/blog/') && 
        url.pathname !== '/blog' &&
        !url.pathname.startsWith('/_astro/') &&
        !url.pathname.startsWith('/@vite/') &&
        !url.pathname.startsWith('/@id/') &&
        !url.pathname.includes('.')) {
      return redirect(`/blog${url.pathname}`, 301);
    }
    
    return next();
  }
);
