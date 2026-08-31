/** Shown at the bottom of the authenticated app shell and every auth
 * screen (login, change-password, etc.) - sticks to the viewport bottom
 * when page content is short, scrolls with content otherwise. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <span>© {year} noolAI. All rights reserved.</span>
      <span>nool<span className="app-footer-dot">.</span>school</span>
    </footer>
  );
}
