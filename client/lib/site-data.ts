export type SiteStat = {
  label: string;
  value: string;
  detail: string;
};

export type Course = {
  slug: string;
  title: string;
  category: string;
  image: string;
  duration: string;
  eligibility: string;
  fees: string;
  seats: number;
  description: string;
  highlights: string[];
};

export type GalleryItem = {
  id: string;
  title: string;
  category: "Campus" | "Students" | "Events" | "Training" | "Classroom" | "Workshops" | "Cultural" | "Sports";
  type: "image" | "video";
  src: string;
};

export const siteStats: SiteStat[] = [
  { label: "Students Trained", value: "5,000+", detail: "Distance and campus-supported learners" },
  { label: "Courses Offered", value: "100+", detail: "UG, PG, Diplomas and Professional programs" },
  { label: "Recognitions", value: "UGC-DEB / NAAC", detail: "Government recognised and accredited" },
  { label: "Placement Support", value: "100% Assistance", detail: "Career guidance and placement help" },
];

export const missionPoints = [
  "Provide flexible, quality distance education for lifelong learners.",
  "Enable career growth through skill-based and accredited programs.",
  "Support rural and urban students with local study centre services.",
];

export const visionPoints = [
  "Be a leading state open university offering accessible higher education.",
  "Bridge academic quality with employability and community impact.",
  "Expand access to recognized programs across Tamil Nadu and beyond.",
];

export const historyTimeline = [
  { year: "1999", title: "State Open University Established", description: "Viveka College established to expand access to higher education across the state." },
  { year: "2008", title: "Study Centres Network", description: "Local study centres established to provide on-ground student support and exams." },
  { year: "2016", title: "Curriculum Expansion", description: "Program portfolio extended to include professional, vocational and technical courses." },
  { year: "2024", title: "Digital acceleration", description: "Admissions, outreach, and content management were modernized for a wider reach." },
];

export const achievements = [
  { label: "Awards & Recognitions", value: "18" },
  { label: "Faculty Members", value: "35+" },
  { label: "Partner Organizations", value: "42" },
  { label: "Community Outreach Programs", value: "120+" },
];

export const infrastructure = [
  "Smart classrooms with presentation-ready teaching tools",
  "Computer and practical labs for hands-on training",
  "Digital library and student resource center",
  "Career guidance, counseling, and placement support",
];

export const facultyHighlights = [
  { name: "Experienced mentors", detail: "Faculty members combine academic expertise with field experience." },
  { name: "Student support", detail: "Focused mentoring, remedial guidance, and progress tracking." },
  { name: "Industry exposure", detail: "Workshops and guest lectures connect students with real-world practice." },
];

export const courseCatalog: Course[] = [
  // Undergraduate - B.Sc
  { slug: 'bsc-maths', title: 'B.Sc - Mathematics', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Three-year degree in Mathematics covering pure and applied topics.', highlights: [] },
  { slug: 'bsc-biotechnology', title: 'B.Sc - Biotechnology', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass (Science preferred)', fees: 'Contact centre', seats: 0, description: 'Life-science focused degree with lab and industry exposure.', highlights: [] },
  { slug: 'bsc-geography', title: 'B.Sc - Geography', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Physical and human geography with applied mapping skills.', highlights: [] },
  { slug: 'bsc-computer-science', title: 'B.Sc - Computer Science', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Core computing degree with programming, systems and applications.', highlights: [] },
  { slug: 'bsc-visual-communication', title: 'B.Sc - Visual Communication', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Study of media, design, and visual storytelling techniques.', highlights: [] },

  // Undergraduate - B.A
  { slug: 'ba-tamil', title: 'B.A - Tamil', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Language and literature studies in Tamil.', highlights: [] },
  { slug: 'ba-tamil-literature', title: 'B.A - Tamil Literature', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'In-depth study of classical and modern Tamil texts.', highlights: [] },
  { slug: 'ba-english-communication', title: 'B.A - English Communication', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'English language, composition and professional communication skills.', highlights: [] },
  { slug: 'ba-history', title: 'B.A - History', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Historical studies covering local, national and world history.', highlights: [] },
  { slug: 'ba-tourism-travel', title: 'B.A - Tourism & Travel Studies', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Hospitality and travel industry focused program.', highlights: [] },
  { slug: 'ba-economics', title: 'B.A - Economics', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Foundations of micro and macro economics.', highlights: [] },
  { slug: 'ba-business-economics', title: 'B.A - Business Economics', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Applied economics for business decision-making.', highlights: [] },
  { slug: 'ba-public-administration', title: 'B.A - Public Administration', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Public policy, governance and administrative studies.', highlights: [] },
  { slug: 'ba-political-science', title: 'B.A - Political Science', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Political theory, institutions and public life.', highlights: [] },
  { slug: 'ba-sociology', title: 'B.A - Sociology', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Social structures, issues and research methods.', highlights: [] },
  { slug: 'ba-social-work', title: 'B.A - Social Work', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Community engagement, welfare and field practice.', highlights: [] },
  { slug: 'ba-human-rights', title: 'B.A - Human Rights', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Study of rights, law and social protections.', highlights: [] },
  { slug: 'ba-islamic-studies', title: 'B.A - Islamic Studies', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Religious studies and cultural context.', highlights: [] },
  { slug: 'ba-criminology', title: 'B.A - Criminology', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Crime, justice systems and prevention strategies.', highlights: [] },
  { slug: 'ba-journalism', title: 'B.A - Journalism', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Reporting, media law and newsroom practice.', highlights: [] },

  // BBA / B.Com / BCA
  { slug: 'bba-computer-application', title: 'B.B.A - Computer Application', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Business applications and IT for management.', highlights: [] },
  { slug: 'bba-retail-management', title: 'B.B.A - Retail Management', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Retail operations, merchandising and management.', highlights: [] },
  { slug: 'bcom-computer-application', title: 'B.Com - Computer Application', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Commerce with practical computing skills.', highlights: [] },
  { slug: 'bcom-accounts', title: 'B.Com - Accounts', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Accounting, taxation and finance fundamentals.', highlights: [] },
  { slug: 'bcom-finance', title: 'B.Com - Finance', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Corporate finance and investment basics.', highlights: [] },
  { slug: 'bcom-bank-management', title: 'B.Com - Bank Management', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Banking operations and financial services.', highlights: [] },
  { slug: 'bca', title: 'BCA - Bachelor of Computer Applications', category: 'Undergraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Software, programming and systems development.', highlights: [] },

  // Postgraduate
  { slug: 'msc-psychology', title: 'M.Sc - Psychology', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Advanced study in psychological theory and practice.', highlights: [] },
  { slug: 'msc-counselling', title: 'M.Sc - Counselling & Psycho Therapy', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Counselling skills and therapeutic practice.', highlights: [] },
  { slug: 'msc-maths', title: 'M.Sc - Mathematics', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Higher mathematics and research-focused topics.', highlights: [] },
  { slug: 'msc-computer-science', title: 'M.Sc - Computer Science', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Advanced computing and software engineering.', highlights: [] },
  { slug: 'ma-history', title: 'M.A - History', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Postgraduate historical analysis and research.', highlights: [] },
  { slug: 'ma-public-administration', title: 'M.A - Public Administration', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Governance, policy and administration.', highlights: [] },
  { slug: 'ma-sociology', title: 'M.A - Sociology', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Advanced social theory and methods.', highlights: [] },
  { slug: 'ma-political-science', title: 'M.A - Political Science', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Political analysis and comparative politics.', highlights: [] },
  { slug: 'ma-economics', title: 'M.A - Economics', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Advanced economic theories and applied topics.', highlights: [] },
  { slug: 'ma-tamil', title: 'M.A - Tamil', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Advanced Tamil studies and research.', highlights: [] },
  { slug: 'ma-english', title: 'M.A - English', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'English literature and communication studies.', highlights: [] },
  { slug: 'ma-social-work', title: 'M.A - Social Work', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Advanced social welfare and field practice.', highlights: [] },
  { slug: 'ma-tourism', title: 'M.A - Tourism & Travel Studies', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Tourism management and research topics.', highlights: [] },
  { slug: 'ma-women-studies', title: 'M.A - Women Studies', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Gender studies and policy.', highlights: [] },
  { slug: 'ma-criminology', title: 'M.A - Criminology & Criminal Justice', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Criminal justice systems and research.', highlights: [] },
  { slug: 'ma-human-rights', title: 'M.A - Human Rights', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Human rights theory, law and advocacy.', highlights: [] },
  { slug: 'ma-journalism', title: 'M.A - Journalism', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Advanced media studies and investigative reporting.', highlights: [] },
  { slug: 'mcom', title: 'M.Com - Master of Commerce', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Commerce, accounting and finance at postgraduate level.', highlights: [] },
  { slug: 'mba', title: 'MBA - Master of Business Administration', category: 'Postgraduate', image: '/collegeimage.png', duration: '2 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Two-year professional management programme.', highlights: [] },
  { slug: 'mca', title: 'MCA - Master of Computer Applications', category: 'Postgraduate', image: '/collegeimage.png', duration: '3 Years', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Three-year postgraduate programme in computing.', highlights: [] },

  // Engineering
  { slug: 'be-civil-engineering', title: 'B.E / B.Tech - Civil Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Core civil engineering topics and field practice.', highlights: [] },
  { slug: 'be-computer-engineering', title: 'B.E / B.Tech - Computer Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Hardware, software and systems engineering.', highlights: [] },
  { slug: 'be-mechanical-engineering', title: 'B.E / B.Tech - Mechanical Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Mechanics, materials and design practice.', highlights: [] },
  { slug: 'be-electronics-engineering', title: 'B.E / B.Tech - Electronics Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Electronic systems and communication engineering.', highlights: [] },
  { slug: 'be-architecture-engineering', title: 'B.E / B.Tech - Architecture Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Architectural design and building technology.', highlights: [] },
  { slug: 'be-surveying-engineering', title: 'B.E / B.Tech - Surveying Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Survey methods and geospatial techniques.', highlights: [] },
  { slug: 'be-building-technology', title: 'B.E / B.Tech - Building Technology Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass', fees: 'Contact centre', seats: 0, description: 'Construction technology and materials.', highlights: [] },
  { slug: 'be-aeronautical-engineering', title: 'B.E / B.Tech - Aeronautical Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Aircraft systems and aerospace engineering.', highlights: [] },
  { slug: 'be-automobile-engineering', title: 'B.E / B.Tech - Automobile Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Vehicle systems, manufacturing and maintenance.', highlights: [] },
  { slug: 'be-marine-engineering', title: 'B.E / B.Tech - Marine Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Ship systems, marine machinery and operations.', highlights: [] },
  { slug: 'be-electrical-engineering', title: 'B.E / B.Tech - Electrical Engineering', category: 'Engineering', image: '/collegeimage.png', duration: '4 Years', eligibility: '12th pass (Science)', fees: 'Contact centre', seats: 0, description: 'Power systems and electrical technology.', highlights: [] },

  // PG Diploma
  { slug: 'pgd-gerontology', title: 'PG Diploma - Gerontology', category: 'PG Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Study of ageing and elder care practices.', highlights: [] },
  { slug: 'pgd-child-rights', title: 'PG Diploma - Child Rights & Child Protection', category: 'PG Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Protection frameworks and child welfare.', highlights: [] },
  { slug: 'pgd-social-welfare', title: 'PG Diploma - Social Welfare Administration', category: 'PG Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Administration for welfare programmes.', highlights: [] },
  { slug: 'pgd-export-marketing', title: 'PG Diploma - Export Marketing', category: 'PG Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'International trade and export practices.', highlights: [] },
  { slug: 'pgd-guidance-counselling', title: 'PG Diploma - Guidance & Counselling', category: 'PG Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: 'UG degree', fees: 'Contact centre', seats: 0, description: 'Counselling practice and career guidance.', highlights: [] },

  // Diploma
  { slug: 'diploma-retail-management', title: 'Diploma - Retail Management', category: 'Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: '10th / 12th pass', fees: 'Contact centre', seats: 0, description: 'Retail operations and merchandising.', highlights: [] },
  { slug: 'diploma-archaeology-epigraphy', title: 'Diploma - Archaeology & Epigraphy', category: 'Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: '10th / 12th pass', fees: 'Contact centre', seats: 0, description: 'Heritage studies and inscription analysis.', highlights: [] },
  { slug: 'diploma-museology-conservation', title: 'Diploma - Museology & Conservation', category: 'Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: '10th / 12th pass', fees: 'Contact centre', seats: 0, description: 'Museum studies and artefact care.', highlights: [] },
  { slug: 'diploma-community-radio', title: 'Diploma - Community Radio Technology', category: 'Diploma', image: '/collegeimage.png', duration: '1 Year', eligibility: '10th / 12th pass', fees: 'Contact centre', seats: 0, description: 'Broadcast technology and community media.', highlights: [] },

  // Medical / Paramedical
  { slug: 'gda', title: 'GDA', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '1-2 Years', eligibility: '10th / ITI', fees: 'Contact centre', seats: 0, description: 'General Duty Assistant training.', highlights: [] },
  { slug: 'dhm-gt', title: 'DHM & GT', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '1-2 Years', eligibility: '10th / ITI', fees: 'Contact centre', seats: 0, description: 'Hospital support and allied training.', highlights: [] },
  { slug: 'ttc', title: 'TTC', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '3 Years', eligibility: '10th / 12th', fees: 'Contact centre', seats: 0, description: 'Teacher training course (TTC).', highlights: [] },
  { slug: 'iti', title: 'ITI', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '1-2 Years', eligibility: '10th pass', fees: 'Contact centre', seats: 0, description: 'Industrial training for trades.', highlights: [] },
  { slug: 'dbc', title: 'DBC', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '1-2 Years', eligibility: '10th / 12th', fees: 'Contact centre', seats: 0, description: 'Diagnostic course training.', highlights: [] },
  { slug: 'dx-ray', title: 'DX-Ray', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '1-2 Years', eligibility: '10th / 12th', fees: 'Contact centre', seats: 0, description: 'Radiography assistant training.', highlights: [] },
  { slug: 'dpm', title: 'DPM', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '1-2 Years', eligibility: '10th / 12th', fees: 'Contact centre', seats: 0, description: 'Paramedical support training.', highlights: [] },
  { slug: 'dac', title: 'DAC', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '1-2 Years', eligibility: '10th / 12th', fees: 'Contact centre', seats: 0, description: 'Allied clinical assistant course.', highlights: [] },
  { slug: 'dmlt', title: 'DMLT', category: 'Medical / Paramedical', image: '/collegeimage.png', duration: '1-2 Years', eligibility: '12th pass (Science preferred)', fees: 'Contact centre', seats: 0, description: 'Medical laboratory technology training.', highlights: [] },
];

export const galleryItems: GalleryItem[] = [
  { id: "campus-1", title: "Main campus facade", category: "Campus", type: "image", src: "/collegeimage.png" },
  { id: "workshop-1", title: "Skill workshop session", category: "Workshops", type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
];

export const contactDetails = {
  address: `Vivega Samuthaya Kalvi\n12–16, SKM Complex,\nBus Stand Opposite,\nDindigul Road,\nTheni, Tamil Nadu`,
  phones: ["04561 – 459374", "94884 55306", "97863 92406", "94882 55306"],
  emails: ["admissions@tnou.edu.in", "info@tnou.edu.in"],
  hours: "Mon - Sat | 9:30 AM - 5:30 PM",
  mapEmbedUrl: "https://www.google.com/maps?q=12-16+SKM+Complex+Theni&output=embed",
};

export const courseCategories = ["All", "Undergraduate", "Postgraduate", "Engineering", "PG Diploma", "Diploma", "Medical / Paramedical", "Management", "Commerce", "Arts", "Science"];
export const galleryCategories = ["All", "Campus", "Students", "Events", "Training", "Classroom", "Workshops", "Cultural"];
