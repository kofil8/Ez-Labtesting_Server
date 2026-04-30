import fs from 'fs';
import path from 'path';

const TESTS_JSON_PATH = path.join(__dirname, '..', 'medical-tests.json');

// A curated list of high-quality, general medical/health public Unsplash images
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80',
  'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80',
  'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&q=80',
  'https://images.unsplash.com/photo-1579684453401-8c149d533b37?w=800&q=80',
  'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
  'https://images.unsplash.com/photo-1583324113626-70df0f4eaf42?w=800&q=80',
  'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800&q=80',
];

async function run() {
  console.log('Reading medical-tests.json...');
  const fileData = fs.readFileSync(TESTS_JSON_PATH, 'utf-8');
  const tests = JSON.parse(fileData);

  let updatedCount = 0;

  for (let i = 0; i < tests.length; i++) {
    if (!tests[i].testImageUrl) {
      // Assign an image based on index to ensure variety
      tests[i].testImageUrl = SAMPLE_IMAGES[i % SAMPLE_IMAGES.length];
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`Adding images to ${updatedCount} tests...`);
    fs.writeFileSync(TESTS_JSON_PATH, JSON.stringify(tests, null, 2), 'utf-8');
    console.log('Successfully updated medical-tests.json!');
  } else {
    console.log('All tests already have an image URL. No changes made.');
  }
}

run().catch(console.error);
