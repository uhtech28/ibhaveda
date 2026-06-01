export interface OptionGroup {
  group: string;
  items: { value: string; label: string }[];
}

// ─── Industry Card Groups ────────────────────────────────────────────────────
// Top-level names are non-selectable headers; sub-items are selectable options.

export const industryCardGroups: OptionGroup[] = [
  {
    group: "Chemicals",
    items: [
      "Commodity Chemicals", "Petrochemicals", "Industrial Gases", "Specialty Chemicals",
      "Agrochemicals", "Paints and Coatings", "Adhesives and Sealants", "Construction Chemicals",
      "Plastic Resins and Polymers", "Rubber and Elastomers", "Synthetic Fibers",
      "Fine Chemicals", "Laboratory Chemicals", "Water Treatment Chemicals", "Explosives and Propellants",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Metals and Mining",
    items: [
      "Coal Mining", "Iron Ore Mining", "Copper Mining", "Gold Mining", "Silver Mining",
      "Platinum Group Metals", "Rare Earth Metals", "Lithium Mining", "Uranium Mining",
      "Industrial Minerals", "Steel Manufacturing", "Aluminum Production", "Copper Smelting",
      "Precious Metals Refining", "Metal Alloys", "Metal Casting", "Forging", "Rolling Mills",
      "Metal Fabrication", "Recycling of Metals",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Automobiles and Private Transportation",
    items: [
      "Passenger Cars", "Two Wheelers", "Electric Vehicles", "Autonomous Vehicles",
      "Commercial Vehicles", "Automotive Components", "Automotive Electronics",
      "Automotive Software", "Automotive Design", "Aftermarket Services",
      "Vehicle Maintenance and Repair", "Vehicle Leasing",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Public Transportation",
    items: [
      "Railways", "Metro Systems", "Bus Transportation", "Tram and Light Rail",
      "Taxi and Ride-Hailing", "Airport Transportation", "Intercity Transport",
      "Logistics Transport Services", "Maritime Passenger Transport",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Media and Entertainment",
    items: [
      "Film Production", "Film Distribution", "Film Exhibition", "TV Broadcasting", "Streaming Platforms",
      "Newspapers", "Magazines", "Book Publishing", "Digital News Media",
      "Music Production", "Music Distribution", "Live Music Events", "Record Labels",
      "Video Game Development", "Game Publishing", "Esports", "Game Streaming",
      "Content Creators", "Influencer Economy", "Podcasts",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Travel, Tourism, and Hospitality",
    items: [
      "Hotels", "Resorts", "Hostels", "Airlines", "Cruise Lines",
      "Tour Operators", "Travel Agencies", "Online Travel Platforms",
      "Adventure Tourism", "Cultural Tourism", "Medical Tourism", "Eco Tourism",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Household Goods and Appliances",
    items: [
      "Refrigerators", "Microwave Ovens", "Dishwashers", "Mixers and Blenders",
      "Air Conditioners", "Heaters", "Air Purifiers",
      "Vacuum Cleaners", "Robotic Cleaners",
      "Plumbing Fixtures", "Water Heaters", "Sanitary Ware",
      "Furniture Manufacturing", "Mattresses", "Home Decor",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Consumer Electronics",
    items: [
      "Televisions", "Smartphones", "Tablets", "Laptops", "Desktop Computers",
      "Wearables", "Smart Home Devices", "Audio Equipment", "Cameras", "Gaming Consoles",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Food, Beverage, Tobacco, and Consumables",
    items: [
      "Packaged Foods", "Dairy Products", "Meat Processing", "Seafood Processing",
      "Bakery Products", "Confectionery",
      "Soft Drinks", "Bottled Water", "Tea and Coffee", "Energy Drinks",
      "Beer", "Wine", "Spirits",
      "Cigarettes", "Cigars", "Smokeless Tobacco",
      "Personal Care Products", "Cleaning Products", "Hygiene Products",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Healthcare and Life Sciences",
    items: [
      "Hospitals", "Clinics", "Diagnostic Centers", "Telemedicine",
      "Drug Manufacturing", "Generic Drugs", "Biopharmaceuticals",
      "Genetic Engineering", "Cell Therapy", "Synthetic Biology",
      "Imaging Equipment", "Surgical Instruments", "Wearable Medical Devices",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Energy",
    items: [
      "Oil Exploration", "Oil Refining", "Natural Gas", "Coal Energy",
      "Solar Power", "Wind Power", "Hydropower", "Geothermal", "Biomass Energy",
      "Hydrogen Energy", "Energy Storage", "Nuclear Energy",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Finance",
    items: [
      "Retail Banking", "Corporate Banking", "Investment Banking",
      "Stock Exchanges", "Brokerage", "Asset Management",
      "Life Insurance", "Health Insurance", "Property Insurance",
      "Venture Capital", "Private Equity", "Hedge Funds",
      "Digital Payments", "Crypto Exchanges", "Lending Platforms",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Aerospace and Aviation",
    items: [
      "Aircraft Manufacturing", "Airline Operations", "Airport Operations",
      "Air Traffic Control", "Satellite Manufacturing", "Space Launch Services", "Space Exploration",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Defence and Security",
    items: [
      "Weapons Manufacturing", "Missile Systems", "Military Vehicles",
      "Cybersecurity Defence", "Surveillance Systems", "Military Logistics", "Private Security",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Construction and Building Materials",
    items: [
      "Residential Construction", "Commercial Construction", "Infrastructure Construction",
      "Cement Manufacturing", "Steel for Construction", "Glass Manufacturing", "Insulation Materials",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Manufacturing (General)",
    items: [
      "Consumer Goods Manufacturing", "Industrial Machinery", "Electronics Manufacturing",
      "Textile Manufacturing", "Plastic Manufacturing", "Packaging Manufacturing",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Industrial Equipment and Services",
    items: [
      "Heavy Machinery", "Industrial Automation", "Robotics Systems",
      "Industrial Maintenance", "Engineering Consulting",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Real Estate",
    items: [
      "Residential Real Estate", "Commercial Real Estate", "Industrial Real Estate",
      "Property Management", "Real Estate Brokerage", "Real Estate Investment Trusts (REITs)",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Telecommunications",
    items: [
      "Mobile Network Operators", "Internet Service Providers", "Satellite Communications",
      "Fiber Networks", "Telecom Infrastructure",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Software and Technology",
    items: [
      "Enterprise Software", "SaaS Platforms", "Mobile Apps", "Cloud Computing",
      "Cybersecurity Software", "AI Platforms", "Data Infrastructure",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Utilities",
    items: [
      "Electricity Generation", "Electricity Transmission", "Electricity Distribution",
      "Water Supply", "Gas Distribution", "Waste Management", "Recycling Services",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Agriculture and Natural Resources",
    items: [
      "Crop Farming", "Livestock Farming", "Dairy Farming", "Aquaculture",
      "Fisheries", "Forestry", "Agricultural Equipment",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Labour and Workforce",
    items: [
      "Contract Labour", "Skilled Trades", "Construction Labour", "Domestic Work", "Industrial Labour",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Corporate and Management Services",
    items: [
      "Corporate Consulting", "Strategy Consulting", "Management Advisory", "Organisational Design",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Sales and Marketing",
    items: [
      "Advertising Agencies", "Public Relations", "Market Research",
      "Brand Consulting", "Sales Outsourcing",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Professional Services",
    items: [
      "Legal Services", "Accounting Services", "Engineering Consulting",
      "Design Services", "Talent Agencies",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Environmental and Social Impact",
    items: [
      "Environmental Consulting", "Waste Recycling", "Carbon Markets",
      "Conservation Organisations", "Climate Tech",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Education and Academia",
    items: [
      "Schools", "Universities", "Online Education",
      "Test Preparation", "Vocational Training", "Educational Publishing",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Retail and Commerce",
    items: [
      "Supermarkets", "Department Stores", "Specialty Stores",
      "Online Marketplaces", "Direct-to-Consumer Brands",
      "Distribution", "Import/Export",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Logistics and Supply Chain",
    items: [
      "Freight Transport", "Shipping and Maritime Logistics", "Air Cargo",
      "Warehousing", "Cold Storage", "Delivery Platforms",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Textiles and Apparel",
    items: [
      "Textile Manufacturing", "Garment Manufacturing", "Fashion Brands",
      "Luxury Goods", "Footwear",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Sports Industry",
    items: [
      "Professional Sports Leagues", "Sports Equipment", "Sports Media",
      "Sports Training", "Sports Management",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Religious and Cultural Institutions",
    items: [
      "Religious Organisations", "Pilgrimage Tourism", "Religious Publishing",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Government and Public Administration",
    items: [
      "Civil Services", "Regulatory Agencies", "Public Infrastructure Management",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Research and Development",
    items: [
      "Scientific Research Institutes", "Corporate R&D", "Technology Incubators",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Security and Risk Management",
    items: [
      "Private Security", "Intelligence Services", "Risk Consulting",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Space Economy",
    items: [
      "Satellite Data", "Space Mining", "Space Tourism", "Orbital Infrastructure",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Creator Economy",
    items: [
      "YouTube and Video Platforms", "Digital Creators", "Online Courses", "Creator Agencies",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Pet Industry",
    items: [
      "Pet Food", "Veterinary Services", "Pet Grooming", "Pet Insurance",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Luxury Industry",
    items: [
      "Luxury Fashion", "Jewellery", "Watches", "Luxury Travel",
    ].map(v => ({ value: v, label: v })),
  },
];

// ─── Skill Card Groups ───────────────────────────────────────────────────────

export const skillCardGroups: OptionGroup[] = [
  {
    group: "Sciences",
    items: [
      "Physics", "Chemistry", "Materials Science", "Nanoscience", "Photonics", "Surface Science", "Cryogenics",
      "Zoology", "Botany", "Microbiology", "Ecology", "Genetics", "Molecular Biology", "Immunology",
      "Neuroscience", "Biotechnology", "Systems Biology", "Marine Biology",
      "Geology", "Geophysics", "Oceanography", "Atmospheric Science", "Meteorology", "Climate Science",
      "Environmental Science", "Hydrology", "Soil Science",
      "Astronomy", "Astrophysics", "Cosmology", "Planetary Science", "Astrobiology", "Space Weather",
      "Data Science", "Cognitive Science", "Complexity Science", "Systems Science",
      "Agricultural Science", "Food Science", "Forensic Science",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Engineering and Technology",
    items: [
      "Software Engineering", "AI Engineering", "Machine Learning", "Data Engineering",
      "Cybersecurity", "Blockchain Systems", "Distributed Systems", "Database Systems",
      "Human Computer Interaction", "Game Development", "Computer Graphics", "AR/VR",
      "Microelectronics", "Semiconductor Design", "Signal Processing", "Embedded Systems",
      "Telecommunications Engineering", "Power Systems", "Smart Grids", "Electric Vehicles Engineering",
      "Mechanical Design", "Thermodynamics", "Fluid Mechanics", "Robotics", "Mechatronics",
      "Manufacturing Engineering", "Industrial Engineering", "Production Engineering", "Additive Manufacturing",
      "Aerospace Engineering", "Aerodynamics", "Propulsion Systems", "Satellite Engineering",
      "Aircraft Systems", "Automotive Engineering", "Marine Engineering",
      "Civil Engineering", "Structural Engineering", "Construction Engineering",
      "Transportation Engineering", "Water Resource Engineering", "Urban Infrastructure",
      "Chemical Engineering", "Petroleum Engineering", "Nuclear Engineering",
      "Mining Engineering", "Agricultural Engineering", "Biomedical Engineering", "Materials Engineering",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Mathematics and Quantitative Skills",
    items: [
      "Pure Mathematics", "Applied Mathematics", "Statistics", "Probability Theory",
      "Numerical Analysis", "Mathematical Modelling", "Optimisation", "Operations Research",
      "Cryptography", "Game Theory", "Actuarial Science", "Financial Mathematics",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Architecture and Built Environment",
    items: [
      "Architecture", "Interior Design", "Urban Planning", "Landscape Architecture",
      "Sustainable Design", "Heritage Conservation", "Housing Planning", "Smart Cities Design",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Creative and Artistic Skills",
    items: [
      "Painting", "Sculpture", "Illustration", "Digital Art", "Printmaking", "Street Art",
      "Photography", "Cinematography", "Film Direction", "Film Editing", "Documentary Making", "Video Production",
      "Acting", "Theatre", "Dance", "Musical Performance", "Opera", "Stage Production",
      "Composition", "Instrumental Performance", "Vocal Performance", "Music Production", "Sound Engineering",
      "Graphic Design", "Product Design", "Industrial Design", "UI Design", "UX Design", "Motion Graphics",
      "2D Animation", "3D Animation", "Character Design", "Game Design", "Game Programming", "Level Design",
      "Fiction Writing", "Poetry", "Journalism Writing", "Nonfiction Writing", "Screenwriting", "Editing",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Humanities and Social Sciences",
    items: [
      "Sociology", "Political Science", "Economics", "Anthropology", "Geography", "Demography",
      "Clinical Psychology", "Behavioural Psychology", "Cognitive Psychology", "Organisational Psychology",
      "Media Studies", "Cultural Analysis", "Linguistics", "Semiotics",
      "Political History", "Economic History", "Cultural History", "Military History",
      "Ethics", "Logic", "Metaphysics", "Philosophy of Science",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Business and Economic Skills",
    items: [
      "Corporate Finance", "Investment Banking", "Private Equity", "Venture Capital",
      "Asset Management", "Risk Management", "Financial Modelling", "Trading",
      "Financial Accounting", "Management Accounting", "Taxation", "Auditing", "Forensic Accounting",
      "Strategic Management", "Operations Management", "Project Management", "Product Management",
      "Supply Chain Management",
      "Branding", "Advertising", "Digital Marketing", "Market Research", "Growth Marketing",
      "Startup Formation", "Business Model Design", "Fundraising", "Venture Scaling", "Innovation Management",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Legal and Governance Skills",
    items: [
      "Corporate Law", "Criminal Law", "Constitutional Law", "International Law",
      "Environmental Law", "Intellectual Property Law", "Arbitration", "Policy Drafting", "Legislative Analysis",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Education and Knowledge Transfer",
    items: [
      "Teaching", "Curriculum Design", "Instructional Design", "Academic Research",
      "Educational Technology", "Mentoring", "Tutoring",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Healthcare and Medicine",
    items: [
      "Clinical Medicine", "Surgery", "Diagnostics", "Radiology", "Public Health",
      "Epidemiology", "Nursing", "Physiotherapy", "Occupational Therapy", "Nutrition Science",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Hospitality and Tourism",
    items: [
      "Hotel Management", "Culinary Arts", "Travel Planning", "Tourism Operations",
      "Event Hospitality", "Restaurant Management",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Service Sector Skills",
    items: [
      "Consulting", "Recruitment and HR", "Event Management", "Professional Training",
      "Market Research", "Business Brokerage",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Social Impact and Public Sector",
    items: [
      "Social Work", "NGO Management", "Environmental Advocacy", "Public Policy",
      "Community Development", "Sustainability Management",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Communication Skills",
    items: [
      "Public Speaking", "Negotiation", "Persuasion", "Storytelling",
      "Debate", "Diplomacy", "Media Communication", "Crisis Communication",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Leadership and Organisational Skills",
    items: [
      "Leadership", "Strategic Thinking", "Decision Making", "Conflict Resolution",
      "Team Management", "Organisational Design", "Change Management",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Physical and Performance Skills",
    items: [
      "Athletics", "Team Sports", "Combat Sports", "Gymnastics", "Adventure Sports",
      "Strength Training", "Endurance Training", "Personal Training", "Sports Coaching",
      "Military Strategy", "Security Operations", "Tactical Planning",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Skilled Trades and Crafts",
    items: [
      "Carpentry", "Masonry", "Plumbing", "Electrical Installation", "Welding",
      "Machining", "Automotive Repair", "Aircraft Maintenance", "Industrial Maintenance",
      "Pottery", "Woodworking", "Metalworking", "Textile Craft", "Handloom Weaving",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Agriculture and Natural Resource Skills",
    items: [
      "Farming", "Animal Husbandry", "Forestry", "Fisheries", "Aquaculture",
      "Soil Management", "Irrigation Systems",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Logistics and Operations",
    items: [
      "Supply Chain Planning", "Logistics Management", "Inventory Control",
      "Procurement", "Warehouse Management", "Transportation Planning",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Personal and Cognitive Skills",
    items: [
      "Critical Thinking", "Problem Solving", "Creativity", "Analytical Thinking",
      "Systems Thinking", "Emotional Intelligence", "Adaptability", "Learning Ability",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Digital Economy Skills",
    items: [
      "Social Media Management", "Content Creation", "Influencer Marketing",
      "Online Community Building", "E-commerce Operations", "Platform Moderation",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Political and Diplomatic Skills",
    items: [
      "Governance", "Political Campaigning", "Diplomacy", "Negotiation", "Public Administration",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Religious and Spiritual Skills",
    items: [
      "Theology", "Religious Leadership", "Spiritual Counselling", "Ritual Practice", "Interfaith Dialogue",
    ].map(v => ({ value: v, label: v })),
  },
  {
    group: "Survival and Field Skills",
    items: [
      "Navigation", "Wilderness Survival", "Disaster Response", "Search and Rescue", "First Aid",
    ].map(v => ({ value: v, label: v })),
  },
];

// ─── Flat lists (backwards-compatible) ──────────────────────────────────────
export const industryCardOptions = industryCardGroups.flatMap(g => g.items);
export const skillCardOptions = skillCardGroups.flatMap(g => g.items);

const options = { industryCardOptions, skillCardOptions };
export default options;
