const fs = require('fs');

// Read the scraped data
const rawData = JSON.parse(fs.readFileSync('../devpost-scraper/devpost_winners_2026-01-07.json', 'utf8'));

// Helper to get first 1-2 sentences (crisp summary)
function getCrispSummary(text, maxLength = 200) {
  if (!text) return null;

  // Clean up the text
  let clean = text
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Get first 1-2 sentences
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  let result = sentences[0] || clean;

  // Add second sentence if short enough
  if (sentences[1] && (result.length + sentences[1].length) < maxLength) {
    result += sentences[1];
  }

  // Truncate if still too long
  if (result.length > maxLength) {
    result = result.substring(0, maxLength).trim() + '...';
  }

  return result.trim();
}

// Convert to the format needed by the app
const projects = rawData.map(p => {
  // Build sectioned summary with crisp content
  let sections = [];

  // Overview from AI summary
  if (p.aiSummary) {
    const overview = getCrispSummary(p.aiSummary, 250);
    if (overview) {
      sections.push(`📋 Overview\n${overview}`);
    }
  }

  // What it does
  if (p.whatItDoes) {
    const crisp = getCrispSummary(p.whatItDoes);
    if (crisp) sections.push(`🎯 What it does\n${crisp}`);
  }

  // Inspiration
  if (p.inspiration) {
    const crisp = getCrispSummary(p.inspiration);
    if (crisp) sections.push(`💡 Inspiration\n${crisp}`);
  }

  // How it was built
  if (p.howWeBuiltIt) {
    const crisp = getCrispSummary(p.howWeBuiltIt);
    if (crisp) sections.push(`🔧 How it was built\n${crisp}`);
  }

  // Challenges
  if (p.challenges) {
    const crisp = getCrispSummary(p.challenges);
    if (crisp) sections.push(`⚡ Challenges\n${crisp}`);
  }

  // Accomplishments
  if (p.accomplishments) {
    const crisp = getCrispSummary(p.accomplishments);
    if (crisp) sections.push(`🏆 Accomplishments\n${crisp}`);
  }

  // What we learned
  if (p.whatWeLearned) {
    const crisp = getCrispSummary(p.whatWeLearned);
    if (crisp) sections.push(`📚 What we learned\n${crisp}`);
  }

  // What's next
  if (p.whatsNext) {
    const crisp = getCrispSummary(p.whatsNext);
    if (crisp) sections.push(`🚀 What's next\n${crisp}`);
  }

  // Combine sections
  let summary = sections.join('\n\n');

  // Fallback
  if (!summary && p.tagline) {
    summary = p.tagline;
  }
  if (!summary && p.fullDescription) {
    summary = getCrispSummary(p.fullDescription, 300);
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
    hackathon: p.hackathon || null,
    prize: prize || null,
    techStack: (p.builtWith || []).join(', ') || null,
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
