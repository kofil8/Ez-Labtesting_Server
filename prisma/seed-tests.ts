import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedTest = {
  testCode: string;
  testName: string;
  price: number;
  testImage: string;
  description: string;
  specimenType: string;
  turnaround: number; // hours
  categoryName: string;
};

const seedTests: SeedTest[] = [
  // ── General Health ──────────────────────────────────────────────────────────
  {
    testCode: 'GH-001',
    testName: 'Annual Wellness Panel',
    price: 89,
    testImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200',
    description:
      'Comprehensive baseline including CBC, CMP, lipids, and thyroid for annual wellness.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'General Health',
  },
  {
    testCode: 'GH-002',
    testName: 'Urinalysis (Complete)',
    price: 29,
    testImage: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200',
    description: 'Urine chemistry and microscopy for infection, kidney, and metabolic screening.',
    specimenType: 'Urine',
    turnaround: 24,
    categoryName: 'General Health',
  },
  // ── Infectious Disease ───────────────────────────────────────────────────────
  {
    testCode: 'ID-001',
    testName: 'COVID-19 PCR',
    price: 89,
    testImage: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200',
    description: 'Detects SARS-CoV-2 RNA for accurate active infection diagnosis.',
    specimenType: 'Nasal Swab',
    turnaround: 48,
    categoryName: 'Infectious Disease',
  },
  {
    testCode: 'ID-002',
    testName: 'Influenza A & B with RSV Panel',
    price: 79,
    testImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200',
    description: 'Simultaneous PCR detection of influenza A, influenza B, and RSV.',
    specimenType: 'Nasal Swab',
    turnaround: 48,
    categoryName: 'Infectious Disease',
  },
  // ── Autoimmune ───────────────────────────────────────────────────────────────
  {
    testCode: 'AI-001',
    testName: 'ANA Screen with Reflex',
    price: 65,
    testImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200',
    description: 'Antinuclear antibody screen with reflex titer for autoimmune disease workup.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Autoimmune',
  },
  {
    testCode: 'AI-002',
    testName: 'Anti-dsDNA Antibody',
    price: 69,
    testImage: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=1200',
    description: 'Specific autoantibody marker for systemic lupus erythematosus (SLE).',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Autoimmune',
  },
  // ── Hormones ─────────────────────────────────────────────────────────────────
  {
    testCode: 'HO-001',
    testName: 'Testosterone (Total & Free)',
    price: 65,
    testImage: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200',
    description: 'Measures total and free testosterone for hormone balance evaluation.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Hormones',
  },
  {
    testCode: 'HO-002',
    testName: 'Estradiol (E2)',
    price: 49,
    testImage: 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=1200',
    description: 'Estrogen level assessment for hormonal balance in both men and women.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Hormones',
  },
  // ── Immunology ───────────────────────────────────────────────────────────────
  {
    testCode: 'IM-001',
    testName: 'Complete Immunoglobulins (IgA/IgG/IgM)',
    price: 89,
    testImage: 'https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=1200',
    description: 'Quantifies three antibody classes for immune deficiency and inflammation workup.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Immunology',
  },
  {
    testCode: 'IM-002',
    testName: 'Complement C3 & C4',
    price: 75,
    testImage: 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=1200',
    description: 'Complement proteins for autoimmune, inflammatory, and renal evaluation.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Immunology',
  },
  // ── Liver ────────────────────────────────────────────────────────────────────
  {
    testCode: 'LV-001',
    testName: 'Liver Function Panel',
    price: 49,
    testImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200',
    description: 'ALT, AST, bilirubin, albumin, and alkaline phosphatase liver assessment.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Liver',
  },
  {
    testCode: 'LV-002',
    testName: 'Hepatitis C Antibody with Reflex',
    price: 65,
    testImage: 'https://images.unsplash.com/photo-1580281657702-257584239a0d?w=1200',
    description: 'HCV antibody screen with reflex confirmatory RNA testing when reactive.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Liver',
  },
  // ── Nutrition ────────────────────────────────────────────────────────────────
  {
    testCode: 'NU-001',
    testName: 'Vitamin D, 25-OH',
    price: 55,
    testImage: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200',
    description: 'Evaluates vitamin D status for bone, immune, and metabolic health.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Nutrition',
  },
  {
    testCode: 'NU-002',
    testName: 'Vitamin B12 & Folate',
    price: 59,
    testImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200',
    description: 'Combined B12 and folate for anemia and neurological health assessment.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Nutrition',
  },
  // ── Thyroid ──────────────────────────────────────────────────────────────────
  {
    testCode: 'TH-001',
    testName: 'Thyroid Stimulating Hormone (TSH)',
    price: 32,
    testImage: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200',
    description: 'Primary thyroid screening marker for hypo- and hyperthyroidism.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Thyroid',
  },
  {
    testCode: 'TH-002',
    testName: 'Thyroid Panel (TSH + Free T4 + Free T3)',
    price: 79,
    testImage: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=1200',
    description: 'Complete thyroid function evaluation with all three key markers.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Thyroid',
  },
  // ── Renal ────────────────────────────────────────────────────────────────────
  {
    testCode: 'RN-001',
    testName: 'Comprehensive Kidney Panel',
    price: 59,
    testImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200',
    description: 'BUN, creatinine, eGFR, and electrolytes for complete kidney function assessment.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Renal',
  },
  {
    testCode: 'RN-002',
    testName: 'Microalbumin (Urine)',
    price: 45,
    testImage: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200',
    description: 'Early kidney damage marker especially for diabetic nephropathy monitoring.',
    specimenType: 'Urine',
    turnaround: 48,
    categoryName: 'Renal',
  },
  // ── Cardiac ──────────────────────────────────────────────────────────────────
  {
    testCode: 'CA-001',
    testName: 'Lipid Panel (Complete)',
    price: 45,
    testImage: 'https://images.unsplash.com/photo-1516549655669-df8a8f6b1a56?w=1200',
    description: 'Total cholesterol, HDL, LDL, VLDL, and triglycerides for cardiovascular risk.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Cardiac',
  },
  {
    testCode: 'CA-002',
    testName: 'hs-CRP Cardiac Risk',
    price: 42,
    testImage: 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=1200',
    description: 'High-sensitivity CRP for vascular inflammation and cardiac risk evaluation.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Cardiac',
  },
  // ── Digestive ────────────────────────────────────────────────────────────────
  {
    testCode: 'DG-001',
    testName: 'H. pylori Antibody',
    price: 49,
    testImage: 'https://images.unsplash.com/photo-1579684453377-04807f3ff7d9?w=1200',
    description: 'Detects Helicobacter pylori antibodies linked to gastric ulcers and gastritis.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Digestive',
  },
  {
    testCode: 'DG-002',
    testName: 'Celiac Disease Panel',
    price: 85,
    testImage: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200',
    description:
      'TTG IgA, DGP antibodies, and total IgA for comprehensive celiac disease screening.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Digestive',
  },
  // ── Women's Health ───────────────────────────────────────────────────────────
  {
    testCode: 'WH-001',
    testName: "Women's Hormone Panel",
    price: 89,
    testImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200',
    description:
      "FSH, LH, estradiol, progesterone, and DHEA-S for women's comprehensive hormonal health.",
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: "Women's Health",
  },
  {
    testCode: 'WH-002',
    testName: 'HPV High-Risk Genotyping',
    price: 79,
    testImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200',
    description: 'Identifies high-risk HPV genotypes for cervical cancer risk stratification.',
    specimenType: 'Cervical Swab',
    turnaround: 72,
    categoryName: "Women's Health",
  },
  // ── Cancer ───────────────────────────────────────────────────────────────────
  {
    testCode: 'CN-001',
    testName: 'PSA (Prostate-Specific Antigen)',
    price: 49,
    testImage: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1200',
    description: 'PSA with free PSA ratio for prostate cancer risk assessment and monitoring.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Cancer',
  },
  {
    testCode: 'CN-002',
    testName: 'CA-125 (Ovarian Tumor Marker)',
    price: 65,
    testImage: 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=1200',
    description: 'Tumor marker for ovarian cancer monitoring, staging, and treatment response.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Cancer',
  },
  // ── Hematology ───────────────────────────────────────────────────────────────
  {
    testCode: 'HM-001',
    testName: 'Complete Blood Count (CBC)',
    price: 39,
    testImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200',
    description:
      'Evaluates red cells, white cells, hemoglobin, and platelets for overall blood health.',
    specimenType: 'Whole Blood',
    turnaround: 24,
    categoryName: 'Hematology',
  },
  {
    testCode: 'HM-002',
    testName: 'Iron Studies Panel',
    price: 59,
    testImage: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200',
    description: 'Serum iron, ferritin, TIBC, and transferrin saturation for anemia workup.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Hematology',
  },
  // ── Prenatal ─────────────────────────────────────────────────────────────────
  {
    testCode: 'PR-001',
    testName: 'First Trimester Prenatal Panel',
    price: 149,
    testImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200',
    description:
      'CBC, blood type, Rh, HIV, hepatitis B, rubella, and STIs for early prenatal care.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Prenatal',
  },
  {
    testCode: 'PR-002',
    testName: 'Maternal Serum Quad Screen',
    price: 119,
    testImage: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=1200',
    description: 'AFP, hCG, estriol, and inhibin A to assess chromosomal abnormality risk.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Prenatal',
  },
  // ── Genetics ─────────────────────────────────────────────────────────────────
  {
    testCode: 'GE-001',
    testName: 'BRCA1/BRCA2 Gene Mutation Screen',
    price: 299,
    testImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200',
    description:
      'Hereditary breast and ovarian cancer gene mutation analysis via next-gen sequencing.',
    specimenType: 'Saliva',
    turnaround: 336, // 14 days
    categoryName: 'Genetics',
  },
  {
    testCode: 'GE-002',
    testName: 'Expanded Carrier Screening',
    price: 249,
    testImage: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200',
    description:
      'Screens for 200+ genetic conditions including cystic fibrosis, SMA, and fragile X.',
    specimenType: 'Saliva',
    turnaround: 336, // 14 days
    categoryName: 'Genetics',
  },
  // ── STD Screening ────────────────────────────────────────────────────────────
  {
    testCode: 'ST-001',
    testName: 'Comprehensive STD Panel',
    price: 149,
    testImage: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200',
    description: 'Screens for HIV, syphilis, gonorrhea, chlamydia, hepatitis B/C, and HSV-2.',
    specimenType: 'Serum/Urine',
    turnaround: 48,
    categoryName: 'STD Screening',
  },
  {
    testCode: 'ST-002',
    testName: 'HIV 1/2 Ag/Ab, 4th Generation',
    price: 79,
    testImage: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200',
    description: 'Most sensitive FDA-approved test for early HIV-1 and HIV-2 detection.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'STD Screening',
  },
  // ── Toxicology ───────────────────────────────────────────────────────────────
  {
    testCode: 'TX-001',
    testName: 'Heavy Metals Panel (Blood)',
    price: 129,
    testImage: 'https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=1200',
    description:
      'Lead, mercury, arsenic, and cadmium blood levels for toxic metal exposure assessment.',
    specimenType: 'Whole Blood',
    turnaround: 72,
    categoryName: 'Toxicology',
  },
  {
    testCode: 'TX-002',
    testName: 'Urine Drug Screen (10-Panel)',
    price: 79,
    testImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200',
    description: 'Screens for 10 drug classes in urine for workplace or clinical testing.',
    specimenType: 'Urine',
    turnaround: 24,
    categoryName: 'Toxicology',
  },
  // ── Allergy & Sensitivity ────────────────────────────────────────────────────
  {
    testCode: 'AS-001',
    testName: 'Food Sensitivity Panel (96 Foods)',
    price: 199,
    testImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200',
    description: 'IgG-based sensitivity testing against 96 common food antigens.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Allergy & Sensitivity',
  },
  {
    testCode: 'AS-002',
    testName: 'Environmental Allergen Panel',
    price: 159,
    testImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200',
    description:
      'IgE testing for dust mites, molds, pollen, pet dander, and other environmental allergens.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Allergy & Sensitivity',
  },
  // ── Endocrine ────────────────────────────────────────────────────────────────
  {
    testCode: 'EN-001',
    testName: 'Cortisol (AM)',
    price: 49,
    testImage: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=1200',
    description:
      'Morning cortisol measurement to evaluate adrenal gland function and stress response.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Endocrine',
  },
  {
    testCode: 'EN-002',
    testName: 'IGF-1 (Growth Hormone Marker)',
    price: 79,
    testImage: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200',
    description: 'IGF-1 serves as a stable surrogate marker of growth hormone status.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Endocrine',
  },
  // ── Men's Health ─────────────────────────────────────────────────────────────
  {
    testCode: 'MH-001',
    testName: "Men's Hormone & Metabolic Panel",
    price: 99,
    testImage: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200',
    description: "Testosterone, PSA, lipids, glucose, and CBC for comprehensive men's wellness.",
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: "Men's Health",
  },
  {
    testCode: 'MH-002',
    testName: 'Prostate Health Panel',
    price: 75,
    testImage: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1200',
    description: 'Total and free PSA ratio for improved prostate cancer risk stratification.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: "Men's Health",
  },
  // ── Mental Health ────────────────────────────────────────────────────────────
  {
    testCode: 'ML-001',
    testName: 'Mental Wellness Labs Panel',
    price: 99,
    testImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200',
    description:
      'Thyroid, B12, folate, vitamin D, and CBC to screen organic causes of mood disorders.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Mental Health',
  },
  {
    testCode: 'ML-002',
    testName: 'MTHFR Gene Variant',
    price: 149,
    testImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200',
    description: 'MTHFR C677T/A1298C variant linked to folate metabolism and mood disorders.',
    specimenType: 'Whole Blood',
    turnaround: 72,
    categoryName: 'Mental Health',
  },
  // ── Neurology ────────────────────────────────────────────────────────────────
  {
    testCode: 'NR-001',
    testName: 'Neurological Screening Panel',
    price: 119,
    testImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200',
    description: 'B12, folate, TSH, glucose, and CRP to screen reversible neurological symptoms.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Neurology',
  },
  {
    testCode: 'NR-002',
    testName: 'ApoE Genotyping (Alzheimer Risk)',
    price: 179,
    testImage: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200',
    description:
      "APOE ε4 allele detection for hereditary Alzheimer's disease genetic risk assessment.",
    specimenType: 'Saliva',
    turnaround: 168, // 7 days
    categoryName: 'Neurology',
  },
  // ── Bone Health ──────────────────────────────────────────────────────────────
  {
    testCode: 'BH-001',
    testName: 'Bone Density Marker Panel',
    price: 79,
    testImage: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200',
    description: 'Calcium, phosphorus, vitamin D, PTH, and alkaline phosphatase for bone health.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Bone Health',
  },
  {
    testCode: 'BH-002',
    testName: 'Parathyroid Hormone (PTH)',
    price: 59,
    testImage: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200',
    description: 'Intact PTH to evaluate calcium regulation and parathyroid gland function.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Bone Health',
  },
  // ── Metabolic ────────────────────────────────────────────────────────────────
  {
    testCode: 'MT-001',
    testName: 'Hemoglobin A1c',
    price: 34,
    testImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200',
    description:
      'Reflects average blood glucose over the prior 2-3 months for diabetes monitoring.',
    specimenType: 'Whole Blood',
    turnaround: 24,
    categoryName: 'Metabolic',
  },
  {
    testCode: 'MT-002',
    testName: 'Fasting Insulin & Glucose',
    price: 65,
    testImage: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200',
    description:
      'Used together to calculate HOMA-IR for insulin resistance and metabolic syndrome.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Metabolic',
  },
  // ── Occupational Health ──────────────────────────────────────────────────────
  {
    testCode: 'OH-001',
    testName: 'Pre-Employment Health Screen',
    price: 89,
    testImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200',
    description: 'CBC, CMP, drug screen, and hepatitis B for employment medical clearance.',
    specimenType: 'Serum/Urine',
    turnaround: 24,
    categoryName: 'Occupational Health',
  },
  {
    testCode: 'OH-002',
    testName: 'Respiratory Allergen Panel (Workplace)',
    price: 129,
    testImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200',
    description: 'IgE testing for occupational respiratory allergens including latex and molds.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Occupational Health',
  },
  // ── Reproductive Health ──────────────────────────────────────────────────────
  {
    testCode: 'RH-001',
    testName: 'Female Fertility Panel',
    price: 149,
    testImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200',
    description:
      'AMH, FSH, LH, estradiol, and progesterone for ovarian reserve and fertility assessment.',
    specimenType: 'Serum',
    turnaround: 48,
    categoryName: 'Reproductive Health',
  },
  {
    testCode: 'RH-002',
    testName: 'Semen Analysis',
    price: 89,
    testImage: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200',
    description:
      'Sperm count, motility, morphology, and volume analysis for male fertility evaluation.',
    specimenType: 'Semen',
    turnaround: 24,
    categoryName: 'Reproductive Health',
  },
  // ── Rheumatology ─────────────────────────────────────────────────────────────
  {
    testCode: 'RM-001',
    testName: 'Rheumatoid Arthritis Panel',
    price: 85,
    testImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200',
    description:
      'RF, anti-CCP antibody, CRP, and ESR for RA diagnosis and disease activity monitoring.',
    specimenType: 'Serum',
    turnaround: 72,
    categoryName: 'Rheumatology',
  },
  {
    testCode: 'RM-002',
    testName: 'Uric Acid',
    price: 35,
    testImage: 'https://images.unsplash.com/photo-1579684453377-04807f3ff7d9?w=1200',
    description:
      'Measures serum uric acid for gout diagnosis and urate-lowering treatment monitoring.',
    specimenType: 'Serum',
    turnaround: 24,
    categoryName: 'Rheumatology',
  },
];

const TOTAL = seedTests.length;

async function seedAllTests() {
  console.log(`🌱 Seeding ${TOTAL} tests (2 per category across all 28 categories)...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const testData of seedTests) {
    const category = await prisma.category.findUnique({
      where: { name: testData.categoryName },
      select: { id: true },
    });

    if (!category) {
      throw new Error(`Category not found: "${testData.categoryName}"`);
    }

    const existing = await prisma.test.findFirst({
      where: { testCode: testData.testCode },
      select: { id: true },
    });

    const payload = {
      testCode: testData.testCode,
      testName: testData.testName,
      price: testData.price,
      testImage: testData.testImage,
      description: testData.description,
      specimenType: testData.specimenType,
      turnaround: testData.turnaround,
      categoryId: category.id,
      isActive: true,
      isPublished: true,
    };

    if (existing) {
      await prisma.test.update({ where: { id: existing.id }, data: payload });
      updatedCount++;
      console.log(`🔄 Updated: ${testData.testName}`);
    } else {
      await prisma.test.create({ data: payload });
      createdCount++;
      console.log(`✅ Created: ${testData.testName}`);
    }
  }

  const totalSeeded = await prisma.test.count({
    where: { testCode: { in: seedTests.map((t) => t.testCode) } },
  });

  console.log('----------------------------------------');
  console.log(`✅ Seed complete. Created: ${createdCount}, Updated: ${updatedCount}`);
  console.log(`📦 Total seeded tests present: ${totalSeeded}/${TOTAL}`);
}

async function main() {
  try {
    await seedAllTests();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Test seed failed:', error);
  process.exit(1);
});
