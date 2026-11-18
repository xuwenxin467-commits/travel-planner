Travel Planner website update (Vercel static deployment)

Upload these 7 files to the ROOT of your existing GitHub repository and replace files with the same names:
index.html, style.css, script.js, data.js, manifest.webmanifest, sw.js, icon.svg

Do not upload this ZIP itself. After committing, wait for Vercel deployment to show Ready.
Then open the website and hard refresh (Ctrl+F5). On mobile, close/reopen the page or clear the site's cached data if an old version remains.

The update makes the finish-attraction choice popup follow Chinese/Korean/English and remembers the selected language. The service worker cache name is bumped to refresh old cached files.
