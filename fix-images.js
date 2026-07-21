const fs = require('fs');
const file = 'client/lib/site-data.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\/course-photos\/[^']+\.jpg/g, '/collegeimage.png');
content = content.replace(/\/course-photos\/[^']+\.jpg/g, '/collegeimage.png'); // Just in case
content = content.replace(/\/gallery\/[^']+\.jpg/g, '/collegeimage.png');
content = content.replace(/\/gallery\/[^']+\.mp4/g, 'https://www.w3schools.com/html/mov_bbb.mp4');

// Also catch any images that might be just simple names like "cs.jpg" or "biotech.jpg" without folder, though they should be matched if they were inside /course-photos/
// Ah wait, the user's error showed: `cs.jpg:1 Failed to load resource`. This suggests they might be referenced as `cs.jpg` instead of `/course-photos/cs.jpg`?
// In the array they were `/course-photos/cs.jpg`. Next.js 404s might just show `cs.jpg:1` if the request was made for that file.
// Let's also do a general replace just in case.
fs.writeFileSync(file, content);
console.log('Images replaced!');
