import { User } from '../models/User.js';
import { PolicyProduct } from '../models/PolicyProduct.js';
import { CustomerPolicy } from '../models/CustomerPolicy.js';
import { ConfigurableRule } from '../models/ConfigurableRule.js';
import { connectDB, closeDB } from '../config/db.js';

export const INSURANCE_CATALOG_PRODUCTS = [
  // ==========================================
  // Category A: Health Insurance (5 Products)
  // ==========================================
  {
    productName: 'my Secure',
    insurer: 'HDFC ERGO',
    category: 'HEALTH',
    planCode: 'HLTH-HDF-01',
    description: 'Health insurance for eligible hospitalization and covered medical expenses, subject to the selected plan\'s policy wording, limits, and conditions. Features illustrative 2X coverage restore concepts and comprehensive medical support.',
    coverageLimit: 1000000,
    deductible: 0,
    annualPremium: 18000,
    durationMonths: 12,
    officialUrl: 'https://www.hdfcergo.com/health-insurance/optima-secure',
    coverageTypeLabel: 'Sample Coverage Limit',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Adult entry age from 18 years to 65 years (dependent children eligible from 91 days)',
      'Individual or family floater underwriting evaluation',
      'Medical underwriting and health declaration required; pre-policy health checkup based on age and declared history',
    ],
    keyBenefits: [
      'Eligible inpatient hospitalization and all authorized day-care procedures',
      'Pre-hospitalization (up to 60 days) and post-hospitalization (up to 180 days) medical expense coverage',
      'Illustrative Secure restoration benefit: automatic sum insured recharge for subsequent hospitalizations',
      'Emergency road ambulance cover across accredited network healthcare facilities',
    ],
    exclusions: [
      'Standard initial 30-day waiting period (except for accidental emergency hospitalization)',
      'Specific ailment waiting periods and declared pre-existing illness waiting intervals as per policy schedule',
      'Cosmetic, aesthetic, or non-medically necessary elective treatments',
      'Non-admissible medical consumables and luxury hospital amenity charges',
    ],
    requiredDocuments: [
      'Hospital discharge summary with complete clinical diagnosis and doctor certification',
      'Itemized medical bills, pharmacy receipts, and paid payment vouchers',
      'Prescriptions, laboratory test results, and diagnostic imaging reports',
      'Valid government identity proof (Aadhaar / PAN) and KYC documentation',
    ],
    isPublished: true,
  },
  {
    productName: 'ReAssure',
    insurer: 'Niva Bupa',
    category: 'HEALTH',
    planCode: 'HLTH-NVB-02',
    description: 'Health insurance for eligible hospitalization and covered medical expenses, subject to the selected plan\'s policy wording, limits, and conditions. Includes unlimited restoration provisions and cashless healthcare access.',
    coverageLimit: 1000000,
    deductible: 0,
    annualPremium: 16500,
    durationMonths: 12,
    officialUrl: 'https://www.nivabupa.com/',
    coverageTypeLabel: 'Sample Coverage Limit',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Adult entry age from 18 years with lifelong renewability option',
      'Comprehensive medical declaration required during enrollment',
      'Family floater combinations supporting spouse, dependent children, and dependent parents',
    ],
    keyBenefits: [
      'Eligible inpatient medical care and extensive list of day-care surgical interventions',
      'ReAssure unlimited sum insured reinstatement for subsequent unrelated hospitalizations in the same policy year',
      'Pre- and post-hospitalization medical consultations and diagnostic evaluations',
      'Modern treatments, robotic surgery, and advanced medical procedures within policy terms',
    ],
    exclusions: [
      'Applicable waiting periods for specific medical conditions and pre-existing ailments',
      'Self-inflicted injuries, hazardous adventure sports, or substance abuse rehabilitation',
      'Unproven, experimental, or non-prescribed clinical therapies',
      'Non-medical consumables and hospital administrative service charges',
    ],
    requiredDocuments: [
      'Hospital discharge summary and indoor case paper extracts',
      'Original itemized hospital invoices and numbered payment receipts',
      'Attending medical specialist consultation prescriptions and lab reports',
      'Completed and signed InsureFlow reimbursement or cashless claim intimation form',
    ],
    isPublished: true,
  },
  {
    productName: 'Care Supreme',
    insurer: 'Care Health Insurance',
    category: 'HEALTH',
    planCode: 'HLTH-CAR-03',
    description: 'Health insurance for eligible hospitalization and covered medical expenses, subject to the selected plan\'s policy wording, limits, and conditions. Designed with cumulative bonus boosters and diagnostic care coverage.',
    coverageLimit: 1000000,
    deductible: 0,
    annualPremium: 15000,
    durationMonths: 12,
    officialUrl: 'https://www.careinsurance.com/',
    coverageTypeLabel: 'Sample Coverage Limit',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Eligible entry age from 18 years upward with family floater provisions',
      'Standard health declaration and risk assessment criteria',
      'Subject to underwriter acceptance based on declared medical background',
    ],
    keyBenefits: [
      'Full inpatient hospitalization without room rent capping or ICU sub-limits',
      'Covered advanced day-care procedures requiring less than 24-hour hospital admission',
      'Cumulative bonus booster scaling coverage on claim-free policy terms',
      'Annual preventive health check-up across authorized diagnostic networks',
    ],
    exclusions: [
      'Initial waiting periods and pre-existing medical condition waiting intervals',
      'Elective dental, optical, or cosmetic corrections unless necessitated by accidental trauma',
      'External durable medical appliances, prosthetics, and non-prescribed nutritional supplements',
      'Treatment outside national geographic boundaries unless specific global rider is attached',
    ],
    requiredDocuments: [
      'Comprehensive hospital discharge summary signed by treating physician',
      'Detailed hospital bill break-up with corresponding payment receipts',
      'Doctor prescriptions for all dispensed medications and diagnostic tests',
      'Policy document copy and claimant KYC identification details',
    ],
    isPublished: true,
  },
  {
    productName: 'Comprehensive Insurance Policy',
    insurer: 'Star Health',
    category: 'HEALTH',
    planCode: 'HLTH-STA-04',
    description: 'Health insurance for eligible hospitalization and covered medical expenses, subject to the selected plan\'s policy wording, limits, and conditions. Comprehensive medical umbrella with pediatric, maternity, and critical coverage components.',
    coverageLimit: 1000000,
    deductible: 0,
    annualPremium: 17000,
    durationMonths: 12,
    officialUrl: 'https://www.starhealth.in/',
    coverageTypeLabel: 'Sample Coverage Limit',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Age eligibility: 18 years to 65 years for primary proposer',
      'Children covered from 91 days to 25 years under family floater arrangement',
      'Pre-acceptance medical screening where indicated by age or medical history',
    ],
    keyBenefits: [
      'Hospital room, boarding, and nursing expense coverage without sub-limit proportional deductions',
      'Day-care medical procedures, modern treatment methods, and dialysis coverage',
      'Automatic restoration of basic sum insured up to 100% once during the policy tenure',
      'Emergency medical evacuation assistance and hospital cash allowance where applicable',
    ],
    exclusions: [
      'Pre-existing disease moratorium period as stipulated in underwriting schedule',
      'Birth control procedures, cosmetic surgery, and intentional self-harm',
      'Unregistered clinic admissions or diagnostic-only hospital stays',
      'Standard exclusion of hospital administrative and non-medical disposable supplies',
    ],
    requiredDocuments: [
      'Discharge card / summary from accredited hospital or clinic',
      'Detailed pharmacy invoices along with doctor\'s formal prescription',
      'Investigation reports including pathology, radiology, and ECG tracings',
      'Bank passbook copy or cancelled cheque for Electronic Fund Transfer (NEFT) settlement',
    ],
    isPublished: true,
  },
  {
    productName: 'Activ One',
    insurer: 'Aditya Birla Health Insurance',
    category: 'HEALTH',
    planCode: 'HLTH-ABH-05',
    description: 'Health insurance for eligible hospitalization and covered medical expenses, subject to the selected plan\'s policy wording, limits, and conditions. Built with health-returns rewards and comprehensive inpatient care.',
    coverageLimit: 1000000,
    deductible: 0,
    annualPremium: 16000,
    durationMonths: 12,
    officialUrl: 'https://www.adityabirlacapital.com/healthinsurance',
    coverageTypeLabel: 'Sample Coverage Limit',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Adult proposer entry from age 18 years; lifelong renewable framework',
      'Medical underwriting and fitness declaration submission',
      'Available as individual coverage or family floater protection structure',
    ],
    keyBenefits: [
      'Comprehensive inpatient medical care and extensive list of day-care surgical interventions',
      'Pre-hospitalization and post-hospitalization medical consultation and treatment expenses',
      'Super reload feature replenishing sum insured for subsequent hospitalization episodes',
      'Chronic care management program and preventive wellness incentives',
    ],
    exclusions: [
      'Standard policy waiting periods for defined ailments and specified surgical conditions',
      'Non-allopathic alternative therapies not recognized under institutional clinical standards',
      'Experimental or unproven medication and off-label therapeutic regimes',
      'Hospital admission solely for observation or routine diagnostic monitoring',
    ],
    requiredDocuments: [
      'Certified hospital discharge summary detailing case progression',
      'Itemized billing statements, payment receipts, and implant invoices with stickers',
      'Doctor recommendations and diagnostic test validation reports',
      'KYC documents and active bank verification credentials',
    ],
    isPublished: true,
  },

  // ==========================================
  // Category B: Vehicle Insurance (5 Products)
  // ==========================================
  {
    productName: 'Comprehensive Car Insurance',
    insurer: 'Tata AIG',
    category: 'VEHICLE',
    planCode: 'VEH-TAT-01',
    description: 'Motor insurance for eligible vehicle damage and third-party liabilities, according to the selected cover, insured vehicle details, and policy terms. Provides integrated own-damage protection and mandatory legal liability cover.',
    coverageLimit: 600000,
    deductible: 2000,
    annualPremium: 12000,
    durationMonths: 12,
    officialUrl: 'https://www.tataaig.com/motor-insurance/car-insurance/comprehensive-car-insurance',
    coverageTypeLabel: 'Sample Insured Declared Value (IDV)',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Legally registered private passenger four-wheeler vehicle in India',
      'Valid roadworthiness certificate and continuous insurance continuity record',
      'Accurate disclosure of vehicle registration, chassis number, and registered owner details',
    ],
    keyBenefits: [
      'Eligible own-damage accidental loss and collision impact coverage',
      'Total loss indemnity up to Insured Declared Value in the event of theft or non-recoverable damage',
      'Mandatory statutory third-party legal liability for bodily injury, death, and property damage',
      'Network cashless garage claim repair facilities with authorized quality warranties',
    ],
    exclusions: [
      'Normal mechanical, electrical, or structural wear and gradual depreciation',
      'Operating vehicle under influence of intoxicating alcohol, drugs, or without valid licence',
      'Consequential engine seizure due to hydrostatic lock unless engine protect rider is purchased',
      'Vehicle usage for speed contests, commercial hire, or unpermitted activities outside policy bounds',
    ],
    requiredDocuments: [
      'Vehicle Registration Certificate (RC) book or digital mParivahan certificate',
      'Valid driving licence of the person operating the vehicle during the incident',
      'Detailed incident description, claim intimation form, and accident photographs',
      'Network workshop repair estimate, preliminary assessment report, and police FIR in theft/third-party cases',
    ],
    isPublished: true,
  },
  {
    productName: 'Private Car Package Policy',
    insurer: 'ICICI Lombard',
    category: 'VEHICLE',
    planCode: 'VEH-ICI-02',
    description: 'Motor insurance for eligible vehicle damage and third-party liabilities, according to the selected cover, insured vehicle details, and policy terms. Full-package automotive coverage with rapid digital survey support.',
    coverageLimit: 700000,
    deductible: 2000,
    annualPremium: 13500,
    durationMonths: 12,
    officialUrl: 'https://www.icicilombard.com/motor-insurance/car-insurance',
    coverageTypeLabel: 'Sample Insured Declared Value (IDV)',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Private passenger car with valid Indian motor vehicle registration',
      'Physical or digital vehicle pre-inspection required for lapsed policy renewals',
      'Truthful declaration of previous claim history and No-Claim Bonus (NCB) tier',
    ],
    keyBenefits: [
      'Comprehensive own-damage protection against accidental impacts, overturn, and transit perils',
      'Natural catastrophe cover including flood, inundation, storm, earthquake, and lightning losses',
      'Statutory third-party liability coverage adhering strictly to Motor Vehicles Act provisions',
      'Cashless settlement across extensive accredited network partner workshops nationwide',
    ],
    exclusions: [
      'Gradual wear and tear, rust deterioration, and normal component aging',
      'Driving without a valid driver\'s license or driving beyond permitted geographic limits',
      'Electrical short-circuiting or mechanical breakdown not resulting from an external collision',
      'Compulsory deductible of ₹2,000 payable by the policyholder on every admissible own-damage claim',
    ],
    requiredDocuments: [
      'Certified copy of vehicle Registration Certificate (RC)',
      'Valid driving licence copy of the driver at the time of the occurrence',
      'InsureFlow claim intimation form and geotagged on-site damage photographs',
      'Authorized garage repair estimate, surveyor inspection report, and payment discharge voucher',
    ],
    isPublished: true,
  },
  {
    productName: 'Private Car Insurance',
    insurer: 'SBI General',
    category: 'VEHICLE',
    planCode: 'VEH-SBI-03',
    description: 'Motor insurance for eligible vehicle damage and third-party liabilities, according to the selected cover, insured vehicle details, and policy terms. Trusted motor protection backing own-damage repairs and legal liabilities.',
    coverageLimit: 550000,
    deductible: 2000,
    annualPremium: 11500,
    durationMonths: 12,
    officialUrl: 'https://www.sbigeneral.in/motor-insurance/private-car-insurance',
    coverageTypeLabel: 'Sample Insured Declared Value (IDV)',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Eligible privately registered motor vehicle within standard manufacturer age brackets',
      'Compliance with central and state road transport regulatory guidelines',
      'Accurate declaration of vehicle modifications, fuel type (petrol/diesel/CNG), and safety fittings',
    ],
    keyBenefits: [
      'Accidental physical damage indemnity resulting from collision or overturn',
      'Loss or damage caused by fire, explosion, self-ignition, lightning, or burglary',
      'Legal third-party indemnity against property damage and bodily injury claims',
      'Personal accident cover for owner-driver up to statutory regulatory mandate',
    ],
    exclusions: [
      'Operating vehicle in intoxicated state or while violating traffic safety laws',
      'Standard wear and tear, tyre damage without concurrent chassis impact, or mechanical defect',
      'Damage sustained while vehicle was operated outside declared private domestic usage',
      'Standard deductible deductions as stipulated in the motor underwriting schedule',
    ],
    requiredDocuments: [
      'Valid vehicle RC, motor policy schedule, and driver\'s driving licence',
      'Detailed accident description and incident location photographs',
      'Final workshop repair invoice and proof of deductible settlement',
      'Police FIR or panchnama in cases involving third-party injury, property damage, or theft',
    ],
    isPublished: true,
  },
  {
    productName: 'Private Car Insurance',
    insurer: 'Bajaj General Insurance',
    category: 'VEHICLE',
    planCode: 'VEH-BAJ-04',
    description: 'Motor insurance for eligible vehicle damage and third-party liabilities, according to the selected cover, insured vehicle details, and policy terms. Fast-track surveyor assessment and comprehensive roadside support.',
    coverageLimit: 800000,
    deductible: 2000,
    annualPremium: 14000,
    durationMonths: 12,
    officialUrl: 'https://www.bajajgeneralinsurance.com/',
    coverageTypeLabel: 'Sample Insured Declared Value (IDV)',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Privately owned passenger motor car with valid Indian vehicle registration',
      'Underwriter acceptance and vehicle inspection verification where required',
      'Accurate declaration of ownership continuity and geographical operating zones',
    ],
    keyBenefits: [
      'Bumper-to-bumper vehicle own-damage accidental indemnity up to agreed sample IDV',
      'Protection against vandalism, strikes, civil commotion, and severe weather storms',
      'Statutory third-party liability coverage protecting against legal liability liabilities',
      'Cashless claim settlement across 7,000+ verified partner repair workshops',
    ],
    exclusions: [
      'Driving under the influence of alcohol, drugs, or psychotropic substances',
      'Damage caused by overloaded luggage or operation on unpassable non-road terrain',
      'Mechanical or electronic failure without external violent collision',
      'Unapproved racing, speed-testing, or commercial passenger carriage',
    ],
    requiredDocuments: [
      'Vehicle Registration Certificate (RC) and valid driving licence',
      'Detailed InsureFlow digital motor claim filing form with damage description',
      'Incident photos, repair quotation from authorized garage, and surveyor report',
      'Police report where third-party involvement or vehicle theft is registered',
    ],
    isPublished: true,
  },
  {
    productName: 'Private Car Insurance',
    insurer: 'Reliance General Insurance',
    category: 'VEHICLE',
    planCode: 'VEH-REL-05',
    description: 'Motor insurance for eligible vehicle damage and third-party liabilities, according to the selected cover, insured vehicle details, and policy terms. Value-packed motor package with instant digital claim assistance.',
    coverageLimit: 450000,
    deductible: 2000,
    annualPremium: 10500,
    durationMonths: 12,
    officialUrl: 'https://www.reliancegeneral.co.in/',
    coverageTypeLabel: 'Sample Insured Declared Value (IDV)',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Private motor vehicle holding active registration with Regional Transport Authority (RTO)',
      'Pre-inspection compliance for break-in insurance renewals',
      'Disclosure of previous policy details, NCB percentage, and installed anti-theft equipment',
    ],
    keyBenefits: [
      'Own-damage accidental loss cover covering impact, collision, and turnover losses',
      'Cover against fire, self-ignition, explosion, theft, and natural catastrophes',
      'Mandatory third-party coverage for legal liabilities regarding third-party injury or property',
      'Cashless service network with doorstep survey and automated claim tracking',
    ],
    exclusions: [
      'Consequential losses, depreciation, and routine component wear-and-tear',
      'Unlicensed driving or unauthorized drivers not meeting policy provisions',
      'Mechanical/electrical breakdown not resulting from an accidental impact',
      'Applicable compulsory excess (deductible) of ₹2,000 on admissible damage claims',
    ],
    requiredDocuments: [
      'Vehicle RC copy and driver\'s valid driving licence credentials',
      'Claim intimation submission and high-resolution damage photographs',
      'Garage preliminary estimate and licensed surveyor assessment documentation',
      'FIR report filed with local police station in cases of total theft or fatal accidents',
    ],
    isPublished: true,
  },

  // ==========================================
  // Category C: Property Insurance (5 Products)
  // ==========================================
  {
    productName: 'Bharat Griha Raksha',
    insurer: 'The New India Assurance',
    category: 'PROPERTY',
    planCode: 'PROP-NIA-01',
    description: 'Residential property and household protection for eligible insured events, according to the sections selected, insured values, and issued policy terms. IRDAI-standardized home structure and contents policy from India\'s premier public insurer.',
    coverageLimit: 5000000,
    deductible: 5000,
    annualPremium: 4500,
    durationMonths: 12,
    officialUrl: 'https://www.newindia.co.in/',
    coverageTypeLabel: 'Illustrative Insured Value',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Privately occupied residential home building, flat, or apartment within standard construction norms',
      'Accurate declaration of building carpet area, construction type (pucca/RCC), and usage',
      'Property not utilized for industrial storage, hazardous manufacturing, or commercial activities',
    ],
    keyBenefits: [
      'Home building structure protection against fire, explosion, lightning, and earthquake',
      'Losses arising from storm, cyclone, typhoon, flood, and inundation natural events',
      'Automatic general home contents protection (up to 20% of sum insured without declaration)',
      'Alternative accommodation rent reimbursement while insured home is uninhabitable',
    ],
    exclusions: [
      'Normal wear and tear, gradual structural weathering, and lack of routine building upkeep',
      'Pre-existing structural cracking, willful destruction, or deliberate negligence',
      'Loss or damage to bullion, precious stones, manuscripts, or unrecorded cash beyond limits',
      'War, nuclear contamination, or government confiscation of property',
    ],
    requiredDocuments: [
      'Proof of residential ownership (title deed, municipal property tax receipt) or registered lease',
      'Photographs and videos depicting sustained structural or content damage',
      'Contractor/architect repair cost estimation, itemized invoices, and purchase records',
      'Fire brigade report or police report in fire outbreaks, explosions, or malicious damage incidents',
    ],
    isPublished: true,
  },
  {
    productName: 'Householder\'s Insurance',
    insurer: 'The Oriental Insurance',
    category: 'PROPERTY',
    planCode: 'PROP-ORI-02',
    description: 'Residential property and household protection for eligible insured events, according to the sections selected, insured values, and issued policy terms. Multi-section protection safeguarding building structure, domestic appliances, and household contents.',
    coverageLimit: 3000000,
    deductible: 2500,
    annualPremium: 3500,
    durationMonths: 12,
    officialUrl: 'https://orientalinsurance.org.in/',
    coverageTypeLabel: 'Illustrative Insured Value',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Residential property owned or tenanted for domestic habitation',
      'Class-A or Class-B standard construction with concrete/brick framework',
      'Truthful disclosure of previous property damage history and security measures',
    ],
    keyBenefits: [
      'Indemnity against fire, lightning, explosion, and aircraft damage to residential building',
      'Coverage for household contents including furniture, fixtures, and home electronics',
      'Protection against burglary, housebreaking, and specified natural catastrophe perils',
      'Mechanical and electrical breakdown indemnity for domestic appliances where selected',
    ],
    exclusions: [
      'Depreciation, gradual deterioration, termite infestation, and seasonal moisture damage',
      'Loss of property left in open garden yards or unattended vacant homes beyond 30 consecutive days',
      'Damages resulting from unauthorized structural modifications or municipal demolition',
      'Applicable excess (deductible) of ₹2,500 payable on each settled claim section',
    ],
    requiredDocuments: [
      'Property ownership title documentation, municipal utility bill, or society allotment letter',
      'Visual damage evidence (photographs/video) and detailed statement of loss',
      'Licensed surveyor assessment report, replacement estimates, and repair bills',
      'Police FIR certificate in burglary, theft, or deliberate vandalism occurrences',
    ],
    isPublished: true,
  },
  {
    productName: 'Householder\'s Insurance',
    insurer: 'United India Insurance',
    category: 'PROPERTY',
    planCode: 'PROP-UII-03',
    description: 'Residential property and household protection for eligible insured events, according to the sections selected, insured values, and issued policy terms. Comprehensive household policy shielding family dwellings and personal effects.',
    coverageLimit: 2500000,
    deductible: 2500,
    annualPremium: 3000,
    durationMonths: 12,
    officialUrl: 'https://uiic.co.in/',
    coverageTypeLabel: 'Illustrative Insured Value',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Standard residential premises situated within urban or recognized rural zones',
      'Residential occupancy by proposer, family members, or bona fide domestic tenants',
      'Submission of basic property valuation details and risk location declaration',
    ],
    keyBenefits: [
      'Structure cover for dwelling units against accidental fire, burst water pipes, and storms',
      'Contents protection for household clothing, culinary equipment, and domestic furnishings',
      'Cover against burglary, theft, and forced entry into the domestic premises',
      'Pedal cycle cover, baggage in transit, and public liability extensions where endorsed',
    ],
    exclusions: [
      'Gradual soil subsidence, coastal erosion, or faulty architectural design',
      'Ordinary wear, tear, rusting, and lack of reasonable protective maintenance',
      'Loss of documents, currency notes, shares, stamps, or unmounted precious stones',
      'Deductible deduction as specified in the respective schedule section',
    ],
    requiredDocuments: [
      'Proof of ownership or tenancy agreement for the insured domestic premises',
      'Damage photographs taken immediately following the insured occurrence',
      'Itemized inventory of damaged or lost property with purchase dates and cost estimates',
      'Fire brigade report or police verification document where legally registered',
    ],
    isPublished: true,
  },
  {
    productName: 'Home Insurance',
    insurer: 'Universal Sompo',
    category: 'PROPERTY',
    planCode: 'PROP-USO-04',
    description: 'Residential property and household protection for eligible insured events, according to the sections selected, insured values, and issued policy terms. Contemporary home insurance addressing building structure and valuable modern home contents.',
    coverageLimit: 4000000,
    deductible: 5000,
    annualPremium: 4000,
    durationMonths: 12,
    officialUrl: 'https://www.universalsompo.com/',
    coverageTypeLabel: 'Illustrative Insured Value',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Privately owned or rented residential structure of robust pacca construction',
      'Compliant with local municipal fire safety and structural building codes',
      'Accurate valuation of building reconstruction cost and contents market value',
    ],
    keyBenefits: [
      'Comprehensive protection for building structure against fire, shock, and natural perils',
      'Indemnity for interior home contents, electrical appliances, and decorative installations',
      'Protection against housebreaking, burglary, and accidental external impact damage',
      'Reimbursement for debris removal costs and emergency professional architect fees',
    ],
    exclusions: [
      'Gradual deterioration, corrosion, wet rot, and atmospheric weathering',
      'Damage caused during illegal property construction or unauthorized alterations',
      'Losses arising from unoccupancy exceeding 30 days without prior insurer notice',
      'Compulsory deductible of ₹5,000 per claim occurrence under the property section',
    ],
    requiredDocuments: [
      'Title deed, registered property agreement, or municipal tax assessment bill',
      'Damage photographic documentation and contractor repair quotations',
      'Purchase receipts or asset documentation for claimed high-value electronics',
      'Police intimation and surveyor report validating the origin and extent of loss',
    ],
    isPublished: true,
  },
  {
    productName: 'Home Insurance',
    insurer: 'IFFCO Tokio',
    category: 'PROPERTY',
    planCode: 'PROP-IFF-05',
    description: 'Residential property and household protection for eligible insured events, according to the sections selected, insured values, and issued policy terms. Dependable home shield covering structural restoration and family contents protection.',
    coverageLimit: 3500000,
    deductible: 3000,
    annualPremium: 3800,
    durationMonths: 12,
    officialUrl: 'https://www.iffcotokio.co.in/',
    coverageTypeLabel: 'Illustrative Insured Value',
    isDemonstration: true,
    disclaimer: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
    eligibilityCriteria: [
      'Residential dwelling premises within non-hazardous zones in India',
      'Pucca masonry construction with reinforced concrete roof/ceilings',
      'Accurate declaration of building age, square footage, and insured sum breakdown',
    ],
    keyBenefits: [
      'Building structure coverage against fire, lightning, explosion, aircraft impact, and storm',
      'Household contents indemnity against fire, storm, flood, and burglary',
      'Coverage for domestic appliances against electrical fluctuation and sudden mechanical damage',
      'Emergency relocation allowance and loss of rent coverage for uninhabitable premises',
    ],
    exclusions: [
      'Normal wear and tear, cosmetic degradation, and gradual building settlement',
      'Loss or damage occurring while property is undergoing major structural demolition',
      'Valuables and jewellery unless specifically declared and endorsed in policy schedule',
      'Compulsory excess (deductible) of ₹3,000 on approved property loss settlements',
    ],
    requiredDocuments: [
      'Proof of residential title or legal possession (deed, society certificate, lease)',
      'Color photographs and video recordings of damaged property sections',
      'Itemized contractor restoration estimates and certified repair bills',
      'Surveyor assessment findings and fire department/police reports where mandated',
    ],
    isPublished: true,
  },
];

/**
 * Idempotently seeds or updates the 15 specified insurance products in MongoDB Atlas.
 * Also ensures existing CustomerPolicy references remain intact and valid.
 */
export const seedPolicyProducts = async () => {
  try {
    console.log(`[Seed Products] Upserting ${INSURANCE_CATALOG_PRODUCTS.length} insurance products into Atlas...`);
    const validPlanCodes = INSURANCE_CATALOG_PRODUCTS.map((p) => p.planCode);

    const savedProducts = [];
    for (const item of INSURANCE_CATALOG_PRODUCTS) {
      const saved = await PolicyProduct.findOneAndUpdate(
        { planCode: item.planCode },
        { $set: item },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedProducts.push(saved);
    }

    // Safely update CustomerPolicy references if pointing to old legacy products
    const primaryHealthProduct = savedProducts.find((p) => p.planCode === 'HLTH-HDF-01');
    if (primaryHealthProduct) {
      const legacyPolicies = await CustomerPolicy.find({
        policySource: 'PLATFORM',
        $or: [
          { product: { $exists: false } },
          { product: null },
          { insurerName: 'Apex National Assurance' },
        ],
      });

      for (const pol of legacyPolicies) {
        pol.product = primaryHealthProduct._id;
        pol.insurerName = primaryHealthProduct.insurer;
        pol.category = primaryHealthProduct.category;
        pol.coverageAmount = primaryHealthProduct.coverageLimit;
        pol.deductible = primaryHealthProduct.deductible;
        await pol.save();
        console.log(`[Seed Products] Updated customer policy ${pol.policyNumber} to reference ${primaryHealthProduct.productName}`);
      }
    }

    // Remove old legacy seed products that are NOT among the 15 specified products
    const deleteResult = await PolicyProduct.deleteMany({
      planCode: { $nin: validPlanCodes },
    });
    if (deleteResult.deletedCount > 0) {
      console.log(`[Seed Products] Removed ${deleteResult.deletedCount} legacy demo products.`);
    }

    const totalCount = await PolicyProduct.countDocuments();
    console.log(`[Seed Products] Verification: Atlas DB now contains exactly ${totalCount} policy products.`);
    return savedProducts;
  } catch (error) {
    console.error('[Seed Products Error]', error);
    throw error;
  }
};

export const seedDatabaseIfEmpty = async () => {
  try {
    // 1. Always ensure the 15 policy products are seeded idempotently
    await seedPolicyProducts();

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] Database users already exist. Skipping base user seeding.');
      return;
    }

    console.log('[Seed] Empty database detected. Seeding initial baseline data...');

    // 2. Seed Configurable Rules
    const defaultRules = [
      {
        ruleId: 'RULE_ACTIVE_POLICY_ON_INCIDENT',
        name: 'Policy Active on Incident Date',
        category: 'ELIGIBILITY',
        description: 'Verifies whether the incident date falls within active policy start and expiration dates.',
        isEnabled: true,
        severity: 'BLOCKING',
      },
      {
        ruleId: 'RULE_CATEGORY_MATCH',
        name: 'Insurance Category Match',
        category: 'ELIGIBILITY',
        description: 'Ensures the claimed incident category (HEALTH, VEHICLE, PROPERTY) matches the policy coverage.',
        isEnabled: true,
        severity: 'BLOCKING',
      },
      {
        ruleId: 'RULE_COVERAGE_LIMIT',
        name: 'Coverage Limit Compliance',
        category: 'COVERAGE',
        description: 'Checks whether the requested claim amount is within the maximum coverage limit of the policy.',
        isEnabled: true,
        severity: 'BLOCKING',
      },
      {
        ruleId: 'RULE_REQUIRED_DOCUMENTS',
        name: 'Required Supporting Documents',
        category: 'DOCUMENTS',
        description: 'Verifies that essential proof documents (bills, estimates, reports) are uploaded before approval.',
        isEnabled: true,
        severity: 'FLAGGED',
      },
      {
        ruleId: 'RULE_DUPLICATE_CHECK',
        name: 'Duplicate Submission Detection',
        category: 'FRAUD_PREVENTION',
        description: 'Scans for identical incident dates, policy numbers, or document numbers across existing claims.',
        isEnabled: true,
        severity: 'FLAGGED',
      },
      {
        ruleId: 'RULE_EXTERNAL_POLICY_VERIFICATION',
        name: 'External Policy Authentication',
        category: 'ELIGIBILITY',
        description: 'Checks whether external insurer policies have been manually verified and authenticated by staff.',
        isEnabled: true,
        severity: 'BLOCKING',
      },
      {
        ruleId: 'RULE_SURVEYOR_TRIGGER',
        name: 'Surveyor Technical Inspection Requirement',
        category: 'WORKFLOW',
        description: 'Flags high-value claims (>= ₹4,00,000) or vehicle/property damage claims for mandatory surveyor assessment.',
        isEnabled: true,
        severity: 'INFO',
        parameters: { thresholdAmount: 400000 },
      },
    ];

    await ConfigurableRule.insertMany(defaultRules);
    console.log(`[Seed] Seeded ${defaultRules.length} configurable rules.`);

    // 3. Seed Default Staff & Demo Users
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@insureflow.com',
      password: 'Admin@123',
      role: 'ADMIN',
      phone: '+1 (555) 019-2831',
      department: 'Executive Administration',
      isActive: true,
    });

    const manager = await User.create({
      name: 'Eleanor Vance',
      email: 'manager@insureflow.com',
      password: 'Manager@123',
      role: 'MANAGER',
      phone: '+1 (555) 019-4822',
      department: 'Claims Operations & Approvals',
      isActive: true,
    });

    const officer = await User.create({
      name: 'Marcus Sterling',
      email: 'officer@insureflow.com',
      password: 'Officer@123',
      role: 'OFFICER',
      phone: '+1 (555) 019-3841',
      department: 'Document Verification & Adjudication',
      isActive: true,
    });

    const surveyor = await User.create({
      name: 'Devon Reed',
      email: 'surveyor@insureflow.com',
      password: 'SURVEYOR',
      phone: '+1 (555) 019-9182',
      department: 'Technical Field Inspection',
      isActive: true,
    });

    const customer = await User.create({
      name: 'Arthur Pendelton',
      email: 'customer@insureflow.com',
      password: 'Customer@123',
      role: 'CUSTOMER',
      phone: '+1 (555) 019-7711',
      department: 'Policyholder Services',
      isActive: true,
    });

    console.log('[Seed] Seeded 5 core role users (Admin, Manager, Officer, Surveyor, Customer).');

    // 4. Seed 2 Active Policies for the Demo Customer: 1 Platform and 1 External
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 10);

    const primaryProduct = await PolicyProduct.findOne({ planCode: 'HLTH-HDF-01' });

    // Platform Health Policy
    await CustomerPolicy.create({
      customer: customer._id,
      policySource: 'PLATFORM',
      policyNumber: 'POL-2026-918231',
      product: primaryProduct._id,
      insurerName: primaryProduct.insurer,
      category: 'HEALTH',
      policyholderName: customer.name,
      coverageAmount: primaryProduct.coverageLimit,
      deductible: primaryProduct.deductible,
      startDate,
      endDate,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
    });

    // External Vehicle Policy from a third-party insurer
    await CustomerPolicy.create({
      customer: customer._id,
      policySource: 'EXTERNAL',
      policyNumber: 'EXT-ALLIANZ-882190',
      insurerName: 'Allianz Global Corporate',
      category: 'VEHICLE',
      policyholderName: customer.name,
      coverageAmount: 400000,
      deductible: 2000,
      startDate,
      endDate,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      policyDocumentUrl: '',
      externalVerificationNotes: 'Authenticated with insurer certificate on file.',
    });

    console.log('[Seed] Seeded 2 demo customer policies (Platform Health + External Vehicle).');
    console.log('[Seed] Baseline data seeding completed successfully!');
  } catch (error) {
    console.error('[Seed Error]', error);
  }
};

// If run directly: node src/seed/seedData.js
if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  (async () => {
    await connectDB();
    await seedPolicyProducts();
    await closeDB();
    process.exit(0);
  })();
}
