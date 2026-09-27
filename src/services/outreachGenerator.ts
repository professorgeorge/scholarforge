import type { ReviewerCandidate, EmailTemplate, SearchObjective } from '../types/expertSearch';

export type OutreachTone = 'formal' | 'collegial' | 'expedited';

export function generateOutreachEmail(
  candidate: ReviewerCandidate,
  projectTitle: string,
  contextName: string = 'Research Consortium / Journal',
  tone: OutreachTone = 'formal',
  objective: SearchObjective = 'reviewer'
): EmailTemplate {
  const topWork = candidate.sampleWorks[0];
  const paperCitation = topWork 
    ? `"${topWork.title}" (${topWork.venue || 'recent publication'}, ${topWork.publication_year})` 
    : 'your recent high-impact publications in this domain';

  const authorLastName = candidate.name.split(' ').pop() || candidate.name;
  const honorific = candidate.careerStage === 'Early-Career Specialist' ? 'Dr.' : 'Professor';
  const cleanTitle = projectTitle.trim() || 'Scholarly Research Initiative';

  // -------------------------------------------------------------
  // OBJECTIVE: GRANT CO-INVESTIGATOR (Co-I)
  // -------------------------------------------------------------
  if (objective === 'grant_coi') {
    if (tone === 'collegial') {
      return {
        objective,
        subject: `Grant Collaboration & Co-Investigator Inquiry: ${cleanTitle.slice(0, 55)}...`,
        body: `Dear ${honorific} ${authorLastName},

I hope this email finds you well.

I have been following your impressive research group's trajectory, in particular, your seminal paper on ${paperCitation}. 

Our team is currently preparing a competitive grant application focused on:
"${cleanTitle}"

Given your demonstrated leadership in this domain and your lab's complementary technical capabilities, we believe having you as a Co-Investigator would significantly strengthen the scientific rigor and multi-institutional scope of our proposal.

We are currently drafting the Specific Aims and would welcome the opportunity to discuss how your team's aims could be synergistically integrated, alongside dedicated budget allocations and co-PI/Co-I responsibilities.

Would you be open to a brief 20-minute introductory call sometime next week?

Thank you for your consideration, and I look forward to the possibility of collaborating.

Warm regards,

Lead Principal Investigator
${contextName}
`
      };
    }

    if (tone === 'expedited') {
      return {
        objective,
        subject: `[Upcoming Deadline] Co-I Partnership on Grant Proposal: ${cleanTitle.slice(0, 50)}...`,
        body: `Dear ${honorific} ${authorLastName},

We are writing with a time-sensitive invitation regarding an upcoming major grant proposal:
"${cleanTitle}"

Based on your authoritative publications, notably ${paperCitation}, your expertise directly fills a crucial methodological aim for this submission. We are looking to finalize the key personnel roster and institutional commitments.

We would be thrilled to include you as a Co-Investigator with full sub-award budget support for your group.

If you are interested in exploring this partnership, please let us know by replying to this email and we can share the draft narrative and Specific Aims immediately.

Best regards,

Proposal Coordinating Office
${contextName}
`
      };
    }

    // Default: Formal Grant Outreach
    return {
      objective,
      subject: `Inquiry Regarding Co-Investigator Role: "${cleanTitle.slice(0, 60)}..."`,
      body: `Dear ${honorific} ${authorLastName},

I am writing to inquire about your potential interest in joining our consortium as a Co-Investigator on an upcoming institutional research grant application entitled:
"${cleanTitle}"

Our team has noted with great interest your significant contributions to this area, including your work documented in ${paperCitation}. Your methodological expertise and laboratory capabilities represent an outstanding strategic complement to our core aims.

We are prepared to allocate dedicated sub-award funding, personnel support, and co-authorship agreements commensurate with your role.

If you are open to discussing this opportunity, please let us know your availability for a brief discussion. We would be pleased to provide our executive summary and proposed aim distribution for your review.

Sincerely,

Principal Investigator & Consortium Steering Committee
${contextName}
`
    };
  }

  // -------------------------------------------------------------
  // OBJECTIVE: PAPER CO-AUTHOR
  // -------------------------------------------------------------
  if (objective === 'coauthor') {
    if (tone === 'collegial') {
      return {
        objective,
        subject: `Manuscript Co-Authorship & Collaboration: ${cleanTitle.slice(0, 55)}...`,
        body: `Dear ${honorific} ${authorLastName},

I hope all is well.

I am writing because I greatly admire your recent work on ${paperCitation}.

Our research group has generated an exciting dataset and initial manuscript draft examining:
"${cleanTitle}"

We are currently expanding the analysis and discussion sections. Given your proven track record with these methodologies, we would love to invite you to join us as a co-author to help guide the analytical interpretation and co-write the upcoming submission.

If this aligns with your current research interests, I would be delighted to share the draft and figures for your preliminary look.

Best wishes,

Corresponding Author
${contextName}
`
      };
    }

    if (tone === 'expedited') {
      return {
        objective,
        subject: `Rapid Co-Authorship Invitation: Finalizing Paper on ${cleanTitle.slice(0, 50)}...`,
        body: `Dear ${honorific} ${authorLastName},

Our team is currently finalizing a high-impact manuscript submission on:
"${cleanTitle}"

Having studied your landmark publication ${paperCitation}, we believe your input on our validation benchmarks would be invaluable. We are seeking a focused collaborator to contribute to specific analytical sections with full co-authorship.

We are aiming for submission within the coming weeks. If you are interested in reviewing the draft and joining the author list, please let us know and we will send the full package immediately.

Best regards,

Research Team
${contextName}
`
      };
    }

    // Default: Formal Co-Author Outreach
    return {
      objective,
      subject: `Invitation for Academic Collaboration & Co-Authorship: "${cleanTitle.slice(0, 55)}..."`,
      body: `Dear ${honorific} ${authorLastName},

I am writing on behalf of our research team to invite you to collaborate as a co-author on a forthcoming research manuscript entitled:
"${cleanTitle}"

Your pioneering publications, particularly ${paperCitation}, have been foundational to our study design. We believe that your participation in refining our theoretical framing and experimental interpretation would elevate the overall rigor and impact of the manuscript.

We would be honored to share the complete working draft, primary datasets, and proposed author contributions at your convenience.

Thank you very much for your time and consideration.

Respectfully,

Lead Investigator
${contextName}
`
    };
  }

  // -------------------------------------------------------------
  // OBJECTIVE: CONSULTING & SUBJECT MATTER EXPERT (SME)
  // -------------------------------------------------------------
  if (objective === 'consultant') {
    if (tone === 'collegial') {
      return {
        objective,
        subject: `Scientific Advisory & Consulting Inquiry: ${cleanTitle.slice(0, 55)}...`,
        body: `Dear ${honorific} ${authorLastName},

I hope you are having a productive week.

We have been closely following your authoritative research, especially your work on ${paperCitation}.

We are currently leading a strategic technology evaluation focused on:
"${cleanTitle}"

We are seeking a premier academic subject matter expert for an advisory engagement (with standard professional consulting compensation) to review key technical milestones and advise our roadmap.

Would you have 15 minutes in the coming days for a confidential preliminary discussion?

Warm regards,

Technical Strategy Director
${contextName}
`
      };
    }

    if (tone === 'expedited') {
      return {
        objective,
        subject: `[Confidential Advisory] Retaining Subject Matter Expert on ${cleanTitle.slice(0, 45)}...`,
        body: `Dear ${honorific} ${authorLastName},

We are reaching out regarding a time-sensitive consulting engagement in connection with:
"${cleanTitle}"

Given your distinguished stature and publications, notably ${paperCitation}, we would like to retain your expertise for a focused diligence review. Standard advisory honoraria and formal consulting agreements apply.

Please let us know if your institutional policies permit external consulting and if you have availability this month.

Best regards,

Advisory Board Practice
${contextName}
`
      };
    }

    // Default: Formal Consulting Outreach
    return {
      objective,
      subject: `Inquiry for Expert Advisory / Consulting Services: "${cleanTitle.slice(0, 50)}..."`,
      body: `Dear ${honorific} ${authorLastName},

I am writing to inquire whether you would be available for an external scientific consulting engagement regarding:
"${cleanTitle}"

Our initiative requires high-level expert insight into the technical state of the art, patent landscape, and translation feasibility. Given your recognized leadership established in works such as ${paperCitation}, your perspective would be invaluable.

This engagement would be conducted under formal confidentiality agreements with competitive consulting compensation.

If you are open to discussing the scope of work and scheduling, please let us know your preferred contact protocol.

Sincerely,

Scientific Diligence & Advisory Practice
${contextName}
`
    };
  }

  // -------------------------------------------------------------
  // OBJECTIVE: JOURNAL PEER REVIEWER (Default)
  // -------------------------------------------------------------
  if (tone === 'collegial') {
    return {
      objective,
      subject: `Invitation to Review for ${contextName}: "${cleanTitle.slice(0, 50)}..."`,
      body: `Dear ${honorific} ${authorLastName},

I hope this note finds you well.

Given your outstanding research in this area, including your recent work ${paperCitation}, I would be delighted if you would agree to review a new submission to ${contextName}.

Manuscript Details:
Title: "${cleanTitle}"

We are seeking an evaluation of the empirical methodology and scientific rigor within 14-21 days. If you are able to take this on, please let me know or click accept in our editorial system.

Thank you so much for supporting scholarly peer review.

Best regards,

Handling Editor, ${contextName}
`
    };
  }

  if (tone === 'expedited') {
    return {
      objective,
      subject: `[Expedited Request] Review Invitation: ${cleanTitle.slice(0, 50)}...`,
      body: `Dear ${honorific} ${authorLastName},

We have received an urgent, high-priority manuscript submission on:
"${cleanTitle}"

Your expertise, particularly highlighted by ${paperCitation}, makes you the ideal referee to provide an objective assessment. We would be immensely grateful for a rapid turnaround within 10 days.

Please let us know if you can accept this assignment so we may send the confidential PDF without delay.

With gratitude,

Editorial Office, ${contextName}
`
    };
  }

  // Default: Formal Editorial Review Invitation
  return {
    objective,
    subject: `Invitation to Review Manuscript for ${contextName}: "${cleanTitle.slice(0, 50)}..."`,
    body: `Dear ${honorific} ${authorLastName},

On behalf of the Editorial Board of ${contextName}, I cordially invite you to serve as an expert peer reviewer for a newly submitted manuscript entitled:
"${cleanTitle}"

Given your established scholarly expertise, specifically reflected in ${paperCitation}, your critical assessment would be of great value to our editorial decisions and to the authors.

We kindly ask that reviews be returned within 14 days of acceptance.

Please let us know at your earliest convenience whether you are able to accept this invitation. If you are unable to review at this time, recommendations of qualified colleagues would be sincerely appreciated.

Thank you for your valuable contribution to the scholarly community.

Sincerely,

Editor-in-Chief / Associate Editor
${contextName}
`
  };
}
