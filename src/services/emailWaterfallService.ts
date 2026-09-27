import type { ReviewerCandidate } from '../types/expertSearch';
import { resolvePubMedAuthorEmails } from './pubmedAuthorService';

export async function enhanceCandidatesWithEmailWaterfall(
  candidates: ReviewerCandidate[],
  keywords: string
): Promise<ReviewerCandidate[]> {
  // If candidates already have emails from OpenAlex metadata, note them
  const needsEmail = candidates.filter(c => !c.email || c.emailConfidence === 'heuristic');
  if (needsEmail.length === 0) return candidates;

  try {
    // Attempt PubMed XML search for email addresses
    const pubmedResults = await resolvePubMedAuthorEmails(keywords, 15);

    if (pubmedResults.length > 0) {
      return candidates.map(candidate => {
        // If candidate already has verified/high email, keep it
        if (candidate.email && (candidate.emailConfidence === 'verified' || candidate.emailConfidence === 'high')) {
          return candidate;
        }

        const candidateLastName = candidate.name.split(' ').pop()?.toLowerCase() || '';
        
        // Find matching author in PubMed results
        const match = pubmedResults.find(p => {
          const pmLast = p.authorLastName.toLowerCase();
          return pmLast === candidateLastName;
        });

        if (match) {
          return {
            ...candidate,
            email: match.email,
            emailSource: 'pubmed_xml',
            emailConfidence: 'verified'
          };
        }

        return candidate;
      });
    }
  } catch (err) {
    console.warn('Waterfall enrichment warning:', err);
  }

  return candidates;
}
