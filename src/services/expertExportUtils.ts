import type { ReviewerCandidate } from '../types/expertSearch';

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToScholarOneCsv(candidates: ReviewerCandidate[], filename: string = 'scholarone_reviewers.csv') {
  const headers = [
    'Salutation',
    'First Name',
    'Last Name',
    'Email Address',
    'Primary Institution',
    'Country',
    'ORCID',
    'Career Stage',
    'Readiness Score',
    'COI Status',
    'Top Matching Work DOI',
    'Recent Citations'
  ];

  const rows = candidates.map(c => {
    const parts = c.name.split(' ');
    const firstName = parts.slice(0, -1).join(' ') || parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    const salutation = c.careerStage === 'Early-Career Specialist' ? 'Dr.' : 'Prof.';
    const topDoi = c.sampleWorks[0]?.doi || 'N/A';
    const coi = c.coiStatus.hasCoi ? `COI Flag: ${c.coiStatus.reasons[0]}` : 'Clear';

    return [
      `"${salutation}"`,
      `"${firstName.replace(/"/g, '""')}"`,
      `"${lastName.replace(/"/g, '""')}"`,
      `"${(c.email || 'pending-resolution@domain.edu').replace(/"/g, '""')}"`,
      `"${(c.primaryInstitution || 'Academic Institution').replace(/"/g, '""')}"`,
      `"${c.countryCode || 'N/A'}"`,
      `"${c.orcid || 'N/A'}"`,
      `"${c.careerStage}"`,
      `"${c.readinessScore}"`,
      `"${coi.replace(/"/g, '""')}"`,
      `"${topDoi}"`,
      `"${c.totalRecentCitations}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToEditorialManagerCsv(candidates: ReviewerCandidate[], filename: string = 'editorial_manager_reviewers.csv') {
  const headers = [
    'Title',
    'First_Name',
    'Middle_Name',
    'Last_Name',
    'Primary_Email',
    'Institution',
    'Department',
    'Country',
    'ORCID_ID',
    'Keywords',
    'Reviewer_Rating'
  ];

  const rows = candidates.map(c => {
    const parts = c.name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    const middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
    const topKeywords = c.sampleWorks.map(w => w.title).join('; ').slice(0, 150);

    return [
      `"Dr."`,
      `"${firstName.replace(/"/g, '""')}"`,
      `"${middleName.replace(/"/g, '""')}"`,
      `"${lastName.replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.primaryInstitution || '').replace(/"/g, '""')}"`,
      `"Research Faculty"`,
      `"${c.countryCode || ''}"`,
      `"${c.orcid ? c.orcid.replace('https://orcid.org/', '') : ''}"`,
      `"${topKeywords.replace(/"/g, '""')}"`,
      `"${c.readinessScore}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToNihNsfDossierCsv(candidates: ReviewerCandidate[], filename: string = 'grant_coi_consortium_dossier.csv') {
  const headers = [
    'Investigator Name',
    'Primary Institution',
    'Country',
    'ORCID',
    'Career Standing',
    'Grant Fit Score',
    'Estimated h-Index',
    'Recent Citations',
    'Institutional Diversity',
    'Primary Contact Email',
    'Key Methodological Focus'
  ];

  const rows = candidates.map(c => {
    const topWork = c.sampleWorks[0];
    const topTitle = topWork ? topWork.title : 'High-impact domain publications';
    const diversityStatus = c.coiStatus.hasCoi ? 'Institutional Overlap Flag' : 'External Multi-Site Partner';

    return [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.primaryInstitution.replace(/"/g, '""')}"`,
      `"${c.countryCode || 'N/A'}"`,
      `"${c.orcid || 'N/A'}"`,
      `"${c.careerStage}"`,
      `"${c.readinessScore}"`,
      `"${c.hIndexEst}"`,
      `"${c.totalRecentCitations}"`,
      `"${diversityStatus}"`,
      `"${c.email || 'N/A'}"`,
      `"${topTitle.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToCoauthorRosterCsv(candidates: ReviewerCandidate[], filename: string = 'coauthor_collaboration_roster.csv') {
  const headers = [
    'Author Name',
    'Affiliation',
    'Country',
    'Synergy Score',
    'Lead Authorship Track Record',
    'Publication Output Frequency',
    'ORCID',
    'Contact Email',
    'Top Relevant Publication'
  ];

  const rows = candidates.map(c => {
    const topWork = c.sampleWorks[0];
    const topTitle = topWork ? `${topWork.title} (${topWork.venue || 'Journal'}, ${topWork.publication_year})` : 'N/A';
    const hasLead = c.sampleWorks.some(w => w.author_position === 'first' || w.author_position === 'last');

    return [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.primaryInstitution.replace(/"/g, '""')}"`,
      `"${c.countryCode || 'N/A'}"`,
      `"${c.readinessScore}"`,
      `"${hasLead ? 'Verified Lead/Senior Author' : 'Contributing Co-Author'}"`,
      `"${c.publicationVelocity}"`,
      `"${c.orcid || 'N/A'}"`,
      `"${c.email || 'N/A'}"`,
      `"${topTitle.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToConsultingBriefCsv(candidates: ReviewerCandidate[], filename: string = 'consulting_advisory_brief.csv') {
  const headers = [
    'Expert Name',
    'Affiliation',
    'Country',
    'Career Standing',
    'Advisory Authority Score',
    'Estimated h-Index',
    'Lifetime Citation Scale',
    'Contact Email',
    'Domain Stature Summary'
  ];

  const rows = candidates.map(c => {
    return [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.primaryInstitution.replace(/"/g, '""')}"`,
      `"${c.countryCode || 'N/A'}"`,
      `"${c.careerStage}"`,
      `"${c.readinessScore}"`,
      `"${c.hIndexEst}"`,
      `"${c.totalRecentCitations}"`,
      `"${c.email || 'N/A'}"`,
      `"${(c.objectiveFitSummary || 'Recognized domain specialist').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToJson(candidates: ReviewerCandidate[], filename: string = 'scholarly_talent_export.json') {
  const jsonContent = JSON.stringify(candidates, null, 2);
  downloadBlob(jsonContent, filename, 'application/json;charset=utf-8;');
}
