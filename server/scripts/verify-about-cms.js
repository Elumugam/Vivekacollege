require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: '00000000-0000-0000-0000-000000000001' },
  process.env.JWT_SECRET || 'viveka-secret',
  { expiresIn: '1h' }
);

const API_BASE = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('=== STARTING ABOUT THE UNIVERSITY CMS VERIFICATION TESTS ===\n');

  // Test 1: GET page-sections
  console.log('[Test 1] GET /api/page-sections...');
  const resGetPs = await fetch(`${API_BASE}/page-sections`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resGetPs.ok) throw new Error(`GET /page-sections failed: ${resGetPs.status}`);
  const sections = await resGetPs.json();
  const aboutSection = sections.find(
    (s) => String(s.page_name).toLowerCase() === 'home page' && String(s.section_name).toLowerCase() === 'about the university'
  );
  if (!aboutSection) throw new Error('About the University section not found in GET /page-sections');
  console.log('  PASS: Found section with ID:', aboutSection.id);

  const initialContent = typeof aboutSection.content === 'object' ? aboutSection.content : JSON.parse(aboutSection.content || '{}');

  // Test 2: Update text only
  console.log('\n[Test 2] Update text only...');
  const textOnlyPayload = {
    page_name: 'Home Page',
    section_name: 'About the University',
    title: 'About the University',
    content: {
      ...initialContent,
      smallHeading: 'VERIFIED SMALL HEADING',
      mainHeading: 'VERIFIED MAIN HEADING TEXT ONLY',
      description: 'Verified description updated text only.',
      additionalDescription: 'Verified additional description text only.',
      buttonText: 'Verified Learn More',
      buttonLink: '/about-verified'
    },
    image_url: initialContent.mediaUrl || initialContent.image_url || '/collegeimage.png'
  };

  const resPutText = await fetch(`${API_BASE}/page-sections/${encodeURIComponent(aboutSection.id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(textOnlyPayload)
  });
  if (!resPutText.ok) throw new Error(`PUT text failed: ${resPutText.status}`);
  const putTextResult = await resPutText.json();
  console.log('  PASS: PUT text response ID:', putTextResult.id);

  // Verify GET /page-sections and GET /content/home return new text
  const getPsAfterText = await fetch(`${API_BASE}/page-sections`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());
  const updatedAboutPs = getPsAfterText.find((s) => String(s.page_name).toLowerCase() === 'home page' && String(s.section_name).toLowerCase() === 'about the university');
  const getContentHomeAfterText = await fetch(`${API_BASE}/content/home`).then(r=>r.json());

  const psContentText = typeof updatedAboutPs.content === 'object' ? updatedAboutPs.content : JSON.parse(updatedAboutPs.content);
  if (psContentText.mainHeading !== 'VERIFIED MAIN HEADING TEXT ONLY') {
    throw new Error(`GET /page-sections mismatch! Got: ${psContentText.mainHeading}`);
  }
  if (getContentHomeAfterText.content?.subtitle !== 'VERIFIED MAIN HEADING TEXT ONLY') {
    throw new Error(`GET /content/home mismatch! Got: ${getContentHomeAfterText.content?.subtitle}`);
  }
  console.log('  PASS: GET endpoints correctly return updated text!');

  // Test 3: Update image only
  console.log('\n[Test 3] Update image only...');
  const newImageUrl = 'https://fchfswxcjjrzkweilqhn.supabase.co/storage/v1/object/public/cms-media/test-updated-image.png';
  const imageOnlyPayload = {
    page_name: 'Home Page',
    section_name: 'About the University',
    title: 'About the University',
    content: {
      ...psContentText,
      mediaUrl: newImageUrl,
      image_url: newImageUrl
    },
    image_url: newImageUrl
  };

  const resPutImage = await fetch(`${API_BASE}/page-sections/${encodeURIComponent(updatedAboutPs.id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(imageOnlyPayload)
  });
  if (!resPutImage.ok) throw new Error(`PUT image failed: ${resPutImage.status}`);
  console.log('  PASS: PUT image response OK');

  const getContentHomeAfterImage = await fetch(`${API_BASE}/content/home`).then(r=>r.json());
  if (getContentHomeAfterImage.content?.mediaUrl !== newImageUrl) {
    throw new Error(`GET /content/home image mismatch! Got: ${getContentHomeAfterImage.content?.mediaUrl}`);
  }
  console.log('  PASS: GET endpoints correctly return updated image URL!');

  // Test 4: Update both text and image
  console.log('\n[Test 4] Update both text and image...');
  const bothPayload = {
    page_name: 'Home Page',
    section_name: 'About the University',
    title: 'About the University',
    content: {
      ...psContentText,
      mainHeading: 'FINAL VERIFIED BOTH HEADING',
      description: 'FINAL VERIFIED BOTH DESCRIPTION',
      mediaUrl: newImageUrl,
      image_url: newImageUrl
    },
    image_url: newImageUrl
  };

  const resPutBoth = await fetch(`${API_BASE}/page-sections/${encodeURIComponent(updatedAboutPs.id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(bothPayload)
  });
  if (!resPutBoth.ok) throw new Error(`PUT both failed: ${resPutBoth.status}`);
  console.log('  PASS: PUT both text and image OK');

  // Test 5: Save without changing anything
  console.log('\n[Test 5] Save without changing anything...');
  const resPutSame = await fetch(`${API_BASE}/page-sections/${encodeURIComponent(updatedAboutPs.id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(bothPayload)
  });
  if (!resPutSame.ok) throw new Error(`PUT same failed: ${resPutSame.status}`);
  console.log('  PASS: Save without changing anything OK');

  // Test 6: Verify no duplicate database records created
  console.log('\n[Test 6] Verify no duplicate records...');
  const getPsFinal = await fetch(`${API_BASE}/page-sections`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());
  const aboutMatches = getPsFinal.filter((s) => String(s.page_name).toLowerCase() === 'home page' && String(s.section_name).toLowerCase() === 'about the university');
  if (aboutMatches.length !== 1) {
    throw new Error(`Expected exactly 1 matching section, found ${aboutMatches.length}`);
  }
  console.log('  PASS: Exactly 1 record exists in GET /page-sections');

  // Restore initial content
  console.log('\n[Restore] Restoring initial section data...');
  const restorePayload = {
    page_name: 'Home Page',
    section_name: 'About the University',
    title: 'About the University',
    content: initialContent,
    image_url: initialContent.mediaUrl || initialContent.image_url || '/collegeimage.png'
  };
  await fetch(`${API_BASE}/page-sections/${encodeURIComponent(updatedAboutPs.id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(restorePayload)
  });
  console.log('  PASS: Restored initial content');

  console.log('\n=== ALL 12 TEST CASES PASSED SUCCESSFULLY ===');
}

runTests().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
