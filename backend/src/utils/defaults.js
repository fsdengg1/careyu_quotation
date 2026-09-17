const DEFAULT_COMPANY = {
  companyName: "CARE YU AUTOMATION PVT LTD.",
  address:
    "No.1A, Kalyani Industrial Estate,\nAthipet Village,\nAmbattur,\nChennai - 600058,\nTamil Nadu, India.",
  website: "www.careyuautomation.com",
  email: "businesshead@careyu.ai",
  phone: "+91 8925991742",
  logoPath: "/assets/careyu-logo.png",
  defaultGst: 18,
  defaultSoftwareDevelopment:
    "6-8 Weeks from the date of receipt of confirmed order with advance & PO",
  defaultQuotationValidity: "15 Days From the Date of this Offer",
  defaultPaymentTerms:
    "40% advance along with purchase order, 30% after System Installation, 15% after 1st 30 days model Deployment & final 15% after last 30 day model deployment\nRTGS / NEFT BANK DETAILS : YES BANK\nA/C NO : 032457000000340 (Cash Credit Account), IFSC Code : YESB0000324, Branch: Annanagar.",
  defaultWarranty:
    "12 months from the date of commissioning, covering manufacturing defects in supplied hardware and software",
  defaultAmcNote: 'AMC will be applicable at an additional cost starting from Year 4.',
  signatureName: "Shradha",
  signatureDesignation: "Business Head",
  footerTagline: "Racking | Stacking | Automation | Structures | Consulting",
};

const DEFAULT_TERMS = {
  softwareDevelopment: DEFAULT_COMPANY.defaultSoftwareDevelopment,
  quotationValidity: DEFAULT_COMPANY.defaultQuotationValidity,
  paymentTerms: DEFAULT_COMPANY.defaultPaymentTerms,
  warranty: DEFAULT_COMPANY.defaultWarranty,
  generalTerms: "All orders are subject to our acceptance in writing",
  jurisdiction: "All disputes are subject to Thoothukudi Jurisdiction only",
  liability: "offer is subject to no claim for damages and incidental and / or consequential",
  salesTerms: "offer is subject to general terms and conditions of sales",
  insurance:
    "Insurance shall be to the purchaser's account and shall be arranged by purchaser",
  arbitration:
    "ARBITRATION : All disputes arising out of an order against this quotation, the same will be referred to sole arbitrator named by the seller as per the arbitration and conciliation ACT 1996",
  amcNote: DEFAULT_COMPANY.defaultAmcNote,
};

const ABOUT_US = [
  "Care Yu Automation is revolutionizing the perception and utilization of storage systems. At Care Yu, we are committed to implementing cutting-edge technology to provide effective, customized solutions within the storage industry. Our team meticulously plans and designs each space from inception, ensuring that every component is tailored to meet the specific requirements of your business.",
  "In addition to conventional storage optimization, we integrate advanced automation and robotics to streamline operations, minimize manual effort, and improve overall efficiency. Our automated storage solutions include intelligent racking systems that maximize space utilization while simplifying access and retrieval. By incorporating robotics into our solutions, we enable seamless movement of goods, enhancing speed and accuracy in warehouse operations.",
  "We also specialize in vision system services that provide real-time monitoring, error detection, and precise inventory tracking, ensuring that every product is accounted for with minimal risk of misplacement. These technologies work in harmony to create a storage ecosystem that is responsive, reliable, and future-ready.",
  "We adopt a holistic approach to storage solutions, addressing every aspect of our customers' needs and challenges with precision. Our focus extends beyond functionality to ensure that our solutions enhance efficiency and organization. The foundation of our work is built upon integrity, which we consider the core framework of our business. Our commitment to excellence drives us to create products and services that earn your trust and establish long-term relationships. By choosing Care Yu Automation, you gain a partner who is genuinely invested in delivering automated, robotic, and intelligent storage solutions that align perfectly with your business goals.",
];

const GUARANTEE_TEXT = [
  "An installation which complies with these regulations is a full guarantee of safety. This fact is highly valued by insurance companies, and by legal authorities, if a question of liability in work safety arises.",
  "In addition to the above, CARE YU AUTOMATION guarantees the installation for a period of ONE year, covering any defect in manufacturing and assembly. This guarantee does not cover neglectful usage, or any exceptional circumstances not mentioned in this quotation, or when ANY MODIFICATION IN THE INSTALLATION is not carried out by CARE YU AUTOMATION.",
];

module.exports = { DEFAULT_COMPANY, DEFAULT_TERMS, ABOUT_US, GUARANTEE_TEXT };
