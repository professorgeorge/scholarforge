import type { SampleEssay } from '../types/citation';

export const SAMPLE_ESSAYS: SampleEssay[] = [
  {
    id: 'ai-medical-imaging',
    title: 'AI in Medical Diagnostics & Radiology',
    category: 'Computer Science & Medicine',
    description: 'An essay discussing convolutional networks in oncology screening, diagnostic sensitivity, and radiologist workflows.',
    content: `Artificial intelligence has fundamentally transformed the landscape of medical imaging and diagnostic radiology. Convolutional neural networks and deep learning architectures have demonstrated diagnostic accuracy comparable to board-certified radiologists in detecting pulmonary nodules on chest computed tomography scans. Furthermore, deep learning systems applied to digital mammography screening have reduced false-positive rates by over five percent while maintaining high sensitivity for early-stage breast cancer detection.

Beyond image classification, machine learning algorithms are increasingly utilized for triaging acute conditions in emergency departments. Automated algorithms can rapidly flag intracranial hemorrhages on non-contrast head CT scans within minutes of acquisition, significantly reducing time-to-treatment for stroke patients. However, the deployment of clinical AI faces substantial challenges, including dataset shift across different hospital scanner hardware and algorithmic bias toward specific demographic subpopulations. Prospective multi-center clinical trials remain essential to validate real-world efficacy before widespread autonomous adoption.`
  },
  {
    id: 'microplastics-marine',
    title: 'Microplastics in Marine Food Webs',
    category: 'Environmental Science',
    description: 'An analysis of microplastic contamination, trophic transfer across marine species, and endocrine disruption.',
    content: `Plastic pollution in marine ecosystems represents one of the most critical anthropogenic threats to global biodiversity. Microplastics, defined as synthetic polymer particles smaller than five millimeters in diameter, have been detected across every ocean basin, from coastal surface waters to deep-sea benthic sediments exceeding ten thousand meters depth. Zooplankton and benthic filter feeders readily ingest these particles, mistaking them for natural suspended particulate matter.

Trophic transfer of microplastics from primary consumers to higher trophic levels, including teleost fish and marine mammals, has been widely documented in laboratory and field studies. In addition to physical blockage and gastrointestinal lacerations, microplastics act as vectors for hydrophobic persistent organic pollutants such as polychlorinated biphenyls and phthalates. These chemical additives leach into biological tissue, inducing oxidative stress, cellular necrosis, and endocrine disruption in aquatic organisms. Consequently, the bioaccumulation of microplastics poses substantial ecological risks and potential long-term hazards to human food security.`
  },
  {
    id: 'renewable-energy-storage',
    title: 'Renewable Power Grids and Battery Storage',
    category: 'Energy & Engineering',
    description: 'Examines renewable intermittency, grid frequency regulation, and long-duration storage technologies.',
    content: `The rapid global expansion of solar photovoltaics and wind turbines has accelerated the decarbonization of electricity generation. However, the intrinsic intermittency of variable renewable energy sources poses substantial challenges to power grid frequency regulation and supply reliability. Grid operators face steep ramp-rate requirements and potential overgeneration during peak solar production hours, colloquially termed the duck curve phenomenon.

Utility-scale battery energy storage systems, predominantly lithium iron phosphate and nickel manganese cobalt chemistries, have emerged as the primary solution for sub-second frequency containment and short-duration peak shaving. Nevertheless, achieving seasonal balancing and multi-day grid resilience requires the integration of long-duration energy storage technologies, such as vanadium redox flow batteries and green hydrogen electrolysis. Coordinated deployment of distributed energy resources paired with smart inverter technologies significantly enhances transient stability in low-inertia power systems.`
  },
  {
    id: 'neuroscience-sleep-memory',
    title: 'Sleep Architecture and Memory Consolidation',
    category: 'Neuroscience & Psychology',
    description: 'Explores slow-wave sleep, hippocampal-neocortical dialogue, and synaptic plasticity during sleep cycles.',
    content: `Sleep plays an indispensable role in memory consolidation, neural plasticity, and metabolic waste clearance in the central nervous system. During non-rapid eye movement slow-wave sleep, coordinated neural oscillations between thalamic sleep spindles and cortical slow waves facilitate the transfer of newly encoded memories from the temporary hippocampal store to permanent neocortical networks. Experimental disruption of slow-wave sleep significantly impairs declarative memory recall and associative learning in human subjects.

Furthermore, sleep facilitates synaptic homeostasis through the global downscaling of synaptic strength established during wakefulness, thereby preventing neural saturation and preserving synaptic efficiency. Simultaneously, the glymphatic system exhibits a striking increase in convective interstitial fluid exchange during deep sleep, facilitating the clearance of neurotoxic proteins including amyloid-beta and tau. Chronic sleep deprivation disrupts this restorative process, accelerating neurodegenerative pathology and cognitive decline.`
  }
];
