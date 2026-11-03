export function proposeAnonymization(inputText: string, identifiers = "") {
    if (!inputText.trim()) {
      return { output: '', count: 0, items: [] };
    }

    let text = inputText;
    let count = 0;
    const items: { type: string; original: string; replacement: string }[] = [];

    // 1. Self-citation patterns
    const selfCiteRegex = /(?:in\s+our\s+(?:previous|earlier|prior|recent)\s+(?:work|study|investigation|paper|findings)|as\s+(?:we|the\s+authors|our\s+group)\s+(?:showed|demonstrated|reported|published|established))\s*\(([^)]+)\)/gi;
    text = text.replace(selfCiteRegex, (match) => {
      count++;
      items.push({
        type: 'Self-Citation Pattern',
        original: match,
        replacement: '[Self-citation redacted for double-blind review]'
      });
      return `[Self-citation and author identification redacted for double-blind review]`;
    });

    // 2. Institutional names & Universities
    const instRegex = /\b(?:at|from|conducted\s+at|approved\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|College|Institute|Hospital|Center|School\s+of\s+[A-Z][a-z]+|Medical\s+Center))\b/g;
    text = text.replace(instRegex, (_match, inst) => {
      count++;
      items.push({
        type: 'Institutional Affiliation',
        original: inst,
        replacement: '[Institutional Affiliation Redacted]'
      });
      return `at [Institutional Affiliation Redacted for Review]`;
    });

    // 3. Grant / IRB / Protocol numbers
    const grantRegex = /\b(?:NSF|NIH|Grant|Protocol|IRB|CIHR|UKRI|Wellcome\s+Trust|ERC|Horizon)(?:\s+(?:Grant|Award|Protocol))?\s*#?\s*((?=[A-Z0-9-]*\d)[A-Z0-9-]+)\b/gi;
    text = text.replace(grantRegex, (match) => {
      count++;
      items.push({
        type: 'Grant / Ethics ID',
        original: match,
        replacement: '[Grant/Ethics Protocol Redacted]'
      });
      return `[Grant / Protocol Number Redacted for Review]`;
    });

    // 4. Institutional & Personal Email Addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:[A-Za-z]{2,63})\b/gi;
    text = text.replace(emailRegex, (match) => {
      count++;
      items.push({
        type: 'Author Email Address',
        original: match,
        replacement: '[author-email-redacted@anonymous.org]'
      });
      return `[author-email-redacted@anonymous.org]`;
    });

    // 5. Code Repositories & User Profiles (GitHub, OSF, GitLab)
    const repoRegex = /https?:\/\/(?:www\.)?(?:github\.com|osf\.io|gitlab\.com)\/[^\s<>]+/gi;
    text = text.replace(repoRegex, (match) => {
      count++;
      items.push({
        type: 'Repository URL with Username',
        original: match,
        replacement: 'https://anonymous-repository-redacted.org'
      });
      return `https://anonymous-repository-redacted.org/view`;
    });

    // 6. Acknowledgments Block
    const ackRegex = /(?:Acknowledgements?|Author\s+Contributions?|Funding\s+Disclosures?):[\s\S]*?(?=\n\n[A-Z]|\n\n#|\n\n$|$)/gi;
    text = text.replace(ackRegex, (match) => {
      count++;
      items.push({
        type: 'Acknowledgements Block',
        original: match.slice(0, 60) + '...',
        replacement: '[Acknowledgements Section Redacted]'
      });
      return `[Acknowledgements and Author Disclosures Redacted for Double-Blind Review]`;
    });

    for (const identifier of [...new Set(identifiers.split(/\r?\n/).map(value => value.trim()).filter(Boolean))].sort((a, b) => b.length - a.length)) {
      const pattern = new RegExp(identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
      text = text.replace(pattern, match => {
        count++;
        items.push({ type: 'User-specified identifier', original: match, replacement: '[Identifier redacted]' });
        return '[Identifier redacted]';
      });
    }
    return { output: text, count, items };

}
