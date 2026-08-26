/**
 * Service to query publicly available secondary data repositories and registries:
 * 1. ClinicalTrials.gov (NIH / NLM Clinical Trials & Outcome Registries)
 * 2. World Bank Open Data (Macroeconomic, Labor, Health & Development Time-Series)
 * 3. Zenodo (CERN / EU OpenAIRE Open Science Dataset Repository)
 * 4. Harvard Dataverse (International Social Science, Survey & Research Dataverse Network)
 * 5. Europe PMC Open Data (EMBL-EBI Curated Supplementary Data & Cohort Archives)
 */

export interface SecondaryDataRecord {
  id: string;
  source: 'clinicaltrials' | 'worldbank' | 'zenodo' | 'dataverse' | 'europepmc' | 'opendata';
  sourceName: string;
  title: string;
  description: string;
  metrics: string;
  year?: number | string;
  url: string;
  category: string;
  doi?: string;
}

/**
 * Searches ClinicalTrials.gov for registered clinical trial datasets and outcomes.
 */
export async function searchClinicalTrials(query: string, limit = 4): Promise<SecondaryDataRecord[]> {
  const cleanQuery = encodeURIComponent(query.trim());
  if (!cleanQuery) return [];

  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${cleanQuery}&pageSize=${limit}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const studies: any[] = data.studies || [];

    return studies.map((study) => {
      const protocol = study.protocolSection || {};
      const idModule = protocol.identificationModule || {};
      const statusModule = protocol.statusModule || {};
      const designModule = protocol.designModule || {};
      const descModule = protocol.descriptionModule || {};

      const nctId = idModule.nctId || 'NCT-UNKNOWN';
      const title = idModule.briefTitle || idModule.officialTitle || 'Clinical Study Protocol';
      const status = statusModule.overallStatus || 'Completed';
      const enrollment = designModule.enrollmentInfo?.count ? `${designModule.enrollmentInfo.count} participants` : 'Cohort recorded';
      const phases = designModule.phases?.join(', ') || 'Interventional';

      return {
        id: `ct_${nctId}`,
        source: 'clinicaltrials',
        sourceName: 'ClinicalTrials.gov (NIH)',
        title: `${nctId}: ${title}`,
        description: descModule.briefSummary ? descModule.briefSummary.slice(0, 300) + '...' : 'Public clinical registry study record.',
        metrics: `Status: ${status} | Enrollment: ${enrollment} | Phase: ${phases}`,
        year: statusModule.startDateStruct?.date?.split(' ')[1] || new Date().getFullYear(),
        url: `https://clinicaltrials.gov/study/${nctId}`,
        category: 'Clinical Interventional Registry',
      };
    });
  } catch (err) {
    console.warn('ClinicalTrials.gov search failed:', err);
    return [];
  }
}

/**
 * Searches World Bank Open Data API for macroeconomic, public health, and environmental indicator datasets.
 */
export async function searchWorldBankData(query: string, limit = 3): Promise<SecondaryDataRecord[]> {
  const cleanQuery = encodeURIComponent(query.trim());
  if (!cleanQuery) return [];

  try {
    const url = `https://api.worldbank.org/v2/indicator?q=${cleanQuery}&format=json&per_page=${limit}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const indicators: any[] = data[1] || [];

    return indicators.map((ind) => ({
      id: `wb_${ind.id}`,
      source: 'worldbank',
      sourceName: 'World Bank Open Data',
      title: ind.name || 'World Bank Statistical Indicator',
      description: ind.sourceNote ? ind.sourceNote.slice(0, 300) + '...' : 'Global open statistical time-series dataset.',
      metrics: `Indicator ID: ${ind.id} | Source: ${ind.sourceOrganization || 'World Bank Data'}`,
      year: 'Longitudinal Time-Series',
      url: `https://data.worldbank.org/indicator/${ind.id}`,
      category: 'Macroeconomic & Health Indicators',
    }));
  } catch (err) {
    console.warn('World Bank API search failed:', err);
    return [];
  }
}

/**
 * Searches Zenodo Open Science Repository (CERN / EU OpenAIRE).
 */
export async function searchZenodoData(query: string, limit = 3): Promise<SecondaryDataRecord[]> {
  const cleanQuery = encodeURIComponent(query.trim());
  if (!cleanQuery) return [];

  try {
    const url = `https://zenodo.org/api/records?q=${cleanQuery}&type=dataset&size=${limit}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const hits: any[] = data.hits?.hits || [];

    return hits.map((hit) => {
      const meta = hit.metadata || {};
      const doi = hit.doi || meta.doi || '';
      const creators = (meta.creators || []).slice(0, 2).map((c: any) => c.name).join(', ');

      return {
        id: `zenodo_${hit.id}`,
        source: 'zenodo',
        sourceName: 'Zenodo Open Science (CERN)',
        title: meta.title || 'Zenodo Open Research Dataset',
        description: meta.description ? meta.description.replace(/<[^>]+>/g, '').slice(0, 300) + '...' : 'Open access research dataset deposit.',
        metrics: `DOI: ${doi || 'Available'} | Creators: ${creators || 'Research Team'} | License: ${meta.license?.id || 'Open Access'}`,
        year: meta.publication_date?.split('-')[0] || 2024,
        url: hit.links?.html || (doi ? `https://doi.org/${doi}` : `https://zenodo.org/record/${hit.id}`),
        category: 'Open Science Research Data',
        doi,
      };
    });
  } catch (err) {
    console.warn('Zenodo API search failed:', err);
    return [];
  }
}

/**
 * Searches Harvard Dataverse Network for academic research datasets and surveys.
 */
export async function searchHarvardDataverse(query: string, limit = 3): Promise<SecondaryDataRecord[]> {
  const cleanQuery = encodeURIComponent(query.trim());
  if (!cleanQuery) return [];

  try {
    const url = `https://dataverse.harvard.edu/api/search?q=${cleanQuery}&type=dataset&per_page=${limit}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const items: any[] = data.data?.items || [];

    return items.map((item) => {
      const authors = (item.authors || []).slice(0, 2).join(', ');
      const persistentId = item.global_id || '';

      return {
        id: `dv_${item.name?.replace(/\s+/g, '_') || Math.random()}`,
        source: 'dataverse',
        sourceName: 'Harvard Dataverse Network',
        title: item.name || 'Academic Research Dataset',
        description: item.description ? item.description.replace(/<[^>]+>/g, '').slice(0, 300) + '...' : 'Social science & empirical dataset repository record.',
        metrics: `Dataverse: ${item.identifierOfDataverse || 'Harvard Dataverse'} | Authors: ${authors || 'Principal Investigators'}`,
        year: item.published_at?.split('-')[0] || 2024,
        url: item.url || (persistentId ? `https://doi.org/${persistentId.replace(/^doi:/i, '')}` : 'https://dataverse.harvard.edu/'),
        category: 'Social Science & Empirical Dataverse',
        doi: persistentId.startsWith('doi:') ? persistentId.replace(/^doi:/i, '') : undefined,
      };
    });
  } catch (err) {
    console.warn('Harvard Dataverse API search failed:', err);
    return [];
  }
}

/**
 * Searches Europe PMC Open Datasets & Curated Supplementary Archives (EMBL-EBI).
 */
export async function searchEuropePmcDatasets(query: string, limit = 3): Promise<SecondaryDataRecord[]> {
  const cleanQuery = encodeURIComponent(query.trim());
  if (!cleanQuery) return [];

  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=HAS_DATA:y%20AND%20${cleanQuery}&format=json&pageSize=${limit}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const results: any[] = data.resultList?.result || [];

    return results.map((item) => {
      const doi = item.doi || '';
      return {
        id: `epmc_${item.id || item.pmid || Math.random()}`,
        source: 'europepmc',
        sourceName: 'Europe PMC Open Data (EMBL-EBI)',
        title: item.title ? item.title.replace(/\.$/, '') : 'Open Supplementary Cohort Dataset',
        description: `Peer-reviewed study with open supplementary data files and repositories. Published in ${item.journalTitle || 'Academic Journal'}.`,
        metrics: `PMCID: ${item.pmcid || 'PMC-Open'} | DOI: ${doi || 'Available'} | Citations: ${item.citedByCount || 0}`,
        year: item.pubYear || 2024,
        url: doi ? `https://doi.org/${doi}` : (item.pmcid ? `https://europepmc.org/article/PMC/${item.pmcid}` : 'https://europepmc.org'),
        category: 'Biomedical & Observational Cohort Data',
        doi,
      };
    });
  } catch (err) {
    console.warn('Europe PMC Dataset search failed:', err);
    return [];
  }
}

/**
 * Queries all 5 premier Open Public Secondary Data Repositories concurrently.
 */
export async function queryPublicSecondaryData(
  topic: string, 
  focus: string
): Promise<SecondaryDataRecord[]> {
  const query = `${topic} ${focus}`.trim();
  const searchKeyword = topic.split(' ').slice(0, 4).join(' ');

  const [trials, wbIndicators, zenodoRecords, dataverseRecords, epmcRecords] = await Promise.allSettled([
    searchClinicalTrials(query, 3),
    searchWorldBankData(searchKeyword, 2),
    searchZenodoData(query, 3),
    searchHarvardDataverse(query, 3),
    searchEuropePmcDatasets(query, 3),
  ]);

  const results: SecondaryDataRecord[] = [];

  if (trials.status === 'fulfilled') results.push(...trials.value);
  if (zenodoRecords.status === 'fulfilled') results.push(...zenodoRecords.value);
  if (dataverseRecords.status === 'fulfilled') results.push(...dataverseRecords.value);
  if (wbIndicators.status === 'fulfilled') results.push(...wbIndicators.value);
  if (epmcRecords.status === 'fulfilled') results.push(...epmcRecords.value);

  return results;
}
