const fs = require('fs');

// Read the scraped data
const rawData = JSON.parse(fs.readFileSync('../devpost-scraper/devpost_winners_2026-01-07.json', 'utf8'));

// Convert to the format needed by the app
const projects = rawData.map(p => {
  // Extract clean summary
  let summary = '';
  if (p.aiSummary) {
    // Remove markdown formatting and get first meaningful paragraph
    const lines = p.aiSummary
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('*') && !l.startsWith('1.') && !l.startsWith('2.'));
    summary = lines[0] || '';
  }
  if (!summary && p.whatItDoes) {
    summary = p.whatItDoes.split('\n')[0];
  }
  if (!summary && p.tagline) {
    summary = p.tagline;
  }
  if (!summary && p.fullDescription) {
    summary = p.fullDescription.substring(0, 300);
  }

  // Clean summary - remove markdown artifacts
  summary = summary
    .replace(/\*\*/g, '')
    .replace(/IDEA SUMMARY[:\s]*/gi, '')
    .replace(/^\d+\.\s*/, '')
    .trim();

  // Limit length
  if (summary.length > 300) {
    summary = summary.substring(0, 297) + '...';
  }

  // Get clean YouTube URL
  let youtube = '';
  if (p.youtubeLinks && p.youtubeLinks.length > 0) {
    for (const link of p.youtubeLinks) {
      if (link.includes('youtube.com/watch') || link.includes('youtu.be/')) {
        youtube = link;
        break;
      }
    }
    if (!youtube) {
      const embed = p.youtubeLinks[0];
      const match = embed.match(/embed\/([^?]+)/);
      if (match) {
        youtube = `https://www.youtube.com/watch?v=${match[1]}`;
      }
    }
  }

  // Clean prize text
  let prize = '';
  if (p.prizes && p.prizes.length > 0) {
    prize = p.prizes
      .map(pr => pr.replace(/\s+/g, ' ').trim())
      .filter(pr => pr && pr !== 'Winner')
      .join('; ');
  }

  return {
    title: p.title || 'Untitled Project',
    summary: summary || 'No description available.',
    prize: prize || null,
    techStack: (p.builtWith || []).slice(0, 6).join(', ') || null,
    github: (p.githubLinks || [])[0] || null,
    youtube: youtube || null,
    demo: p.demoUrl || null,
    team: (p.team || []).map(t => t.name).join(', ') || null,
    date: p.submittedDate ? p.submittedDate.split('T')[0] : null,
    projectUrl: p.projectUrl || null
  };
}).filter(p => p.title && p.summary);

// Save to src/data
fs.writeFileSync('./src/data/projects.json', JSON.stringify(projects, null, 2));

console.log(`Converted ${projects.length} projects for HackSwipe app`);
console.log('Saved to: src/data/projects.json');

// Show sample
console.log('\nSample project:');
console.log(JSON.stringify(projects[0], null, 2));
