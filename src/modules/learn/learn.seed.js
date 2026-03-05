const { ScorecardSystem, LearningResource } = require('./learn.model');
const logger = require('../../utils/logger');

const systems = [
  // Marketing & Lead Generation (8)
  { category: 'Marketing & Lead Generation', name: 'Year-long automated follow-up sequence', sortOrder: 1 },
  { category: 'Marketing & Lead Generation', name: 'Google My Business optimized and active', sortOrder: 2 },
  { category: 'Marketing & Lead Generation', name: 'Review generation system in place', sortOrder: 3 },
  { category: 'Marketing & Lead Generation', name: 'Social media content calendar', sortOrder: 4 },
  { category: 'Marketing & Lead Generation', name: 'Email newsletter to customer list', sortOrder: 5 },
  { category: 'Marketing & Lead Generation', name: 'Referral program for past customers', sortOrder: 6 },
  { category: 'Marketing & Lead Generation', name: 'Seasonal marketing campaigns', sortOrder: 7 },
  { category: 'Marketing & Lead Generation', name: 'Direct mail / postcard campaigns', sortOrder: 8 },

  // Sales & Conversion (7)
  { category: 'Sales & Conversion', name: 'Defined service menu with flat-rate pricing', sortOrder: 1 },
  { category: 'Sales & Conversion', name: 'Technicians trained on presenting options (Good/Better/Best)', sortOrder: 2 },
  { category: 'Sales & Conversion', name: 'Sales script for service calls', sortOrder: 3 },
  { category: 'Sales & Conversion', name: 'Financing options offered to customers', sortOrder: 4 },
  { category: 'Sales & Conversion', name: 'Maintenance agreement program sold on every call', sortOrder: 5 },
  { category: 'Sales & Conversion', name: 'Follow-up system for unsold estimates', sortOrder: 6 },
  { category: 'Sales & Conversion', name: 'Sales tracking by technician', sortOrder: 7 },

  // Operations & Dispatch (8)
  { category: 'Operations & Dispatch', name: 'Dispatch board / scheduling software active', sortOrder: 1 },
  { category: 'Operations & Dispatch', name: 'Standard operating procedures (SOPs) for technicians', sortOrder: 2 },
  { category: 'Operations & Dispatch', name: 'Technician checklists for every service type', sortOrder: 3 },
  { category: 'Operations & Dispatch', name: 'GPS tracking on all trucks', sortOrder: 4 },
  { category: 'Operations & Dispatch', name: 'Inventory management system', sortOrder: 5 },
  { category: 'Operations & Dispatch', name: 'Uniform and appearance standards enforced', sortOrder: 6 },
  { category: 'Operations & Dispatch', name: 'On-time arrival tracking', sortOrder: 7 },
  { category: 'Operations & Dispatch', name: 'Customer communication before/during/after job', sortOrder: 8 },

  // Financial Systems (8)
  { category: 'Financial Systems', name: 'Monthly P&L reviewed with accountant', sortOrder: 1 },
  { category: 'Financial Systems', name: 'Weekly cash flow tracked', sortOrder: 2 },
  { category: 'Financial Systems', name: 'Overhead calculated and updated quarterly', sortOrder: 3 },
  { category: 'Financial Systems', name: 'Flat-rate pricing based on overhead hourly rate', sortOrder: 4 },
  { category: 'Financial Systems', name: 'Job costing done on every install', sortOrder: 5 },
  { category: 'Financial Systems', name: 'Separate business and personal bank accounts', sortOrder: 6 },
  { category: 'Financial Systems', name: 'Business credit established', sortOrder: 7 },
  { category: 'Financial Systems', name: 'Tax deposits made quarterly', sortOrder: 8 },

  // Human Resources (8)
  { category: 'Human Resources', name: 'Written job descriptions for every role', sortOrder: 1 },
  { category: 'Human Resources', name: 'Hiring process and interview scorecard', sortOrder: 2 },
  { category: 'Human Resources', name: 'Employee handbook in place', sortOrder: 3 },
  { category: 'Human Resources', name: 'Technician training program documented', sortOrder: 4 },
  { category: 'Human Resources', name: 'Performance review system (quarterly or annual)', sortOrder: 5 },
  { category: 'Human Resources', name: 'Technician spiff/bonus program', sortOrder: 6 },
  { category: 'Human Resources', name: 'Company culture document or core values defined', sortOrder: 7 },
  { category: 'Human Resources', name: 'Background check process for all hires', sortOrder: 8 },

  // Customer Experience (6)
  { category: 'Customer Experience', name: 'Post-service follow-up call or text', sortOrder: 1 },
  { category: 'Customer Experience', name: 'Warranty policy documented and communicated', sortOrder: 2 },
  { category: 'Customer Experience', name: 'Customer complaint resolution process', sortOrder: 3 },
  { category: 'Customer Experience', name: 'Net Promoter Score or satisfaction survey', sortOrder: 4 },
  { category: 'Customer Experience', name: 'Loyalty/VIP customer program', sortOrder: 5 },
  { category: 'Customer Experience', name: 'Birthday or holiday outreach to customers', sortOrder: 6 },

  // Leadership & Growth (9)
  { category: 'Leadership & Growth', name: 'Org chart defined (even if just you)', sortOrder: 1 },
  { category: 'Leadership & Growth', name: '90-day business goals written down', sortOrder: 2 },
  { category: 'Leadership & Growth', name: 'Weekly team meeting or huddle', sortOrder: 3 },
  { category: 'Leadership & Growth', name: 'Owner working ON the business, not just IN it', sortOrder: 4 },
  { category: 'Leadership & Growth', name: 'Mastermind group or business coach', sortOrder: 5 },
  { category: 'Leadership & Growth', name: 'Business dashboard reviewed weekly', sortOrder: 6 },
  { category: 'Leadership & Growth', name: 'Succession or exit plan started', sortOrder: 7 },
  { category: 'Leadership & Growth', name: 'Business insurance reviewed annually', sortOrder: 8 },
  { category: 'Leadership & Growth', name: 'Vision statement for 3-5 years ahead', sortOrder: 9 },
];

async function seedScorecardSystems() {
  try {
    const count = await ScorecardSystem.countDocuments();
    if (count === 0) {
      await ScorecardSystem.insertMany(systems);
      logger.info(`Seeded ${systems.length} scorecard systems`);
    } else {
      logger.info(`Scorecard systems already seeded (${count} found)`);
    }
  } catch (err) {
    logger.error('Error seeding scorecard systems:', err.message);
  }
}

// Learning resources: YouTube playlists and videos mapped to scorecard systems
const learningResources = [
  {
    systemName: 'Social media content calendar',
    type: 'video',
    title: 'YouTube Training: Marketing & Social Media Strategy',
    description: 'Full YouTube playlist covering social media content strategy and marketing best practices.',
    url: 'https://www.youtube.com/playlist?list=PL1NdI7-ewuRNkYkFQ2eCG5-raHIwS3ssf',
    sortOrder: 1,
  },
  {
    systemName: 'Technicians trained on presenting options (Good/Better/Best)',
    type: 'video',
    title: 'YouTube Training: Sales Presentation Techniques',
    description: 'Full YouTube playlist on presenting service options and closing sales effectively.',
    url: 'https://www.youtube.com/playlist?list=PL1NdI7-ewuRPYQ2XdYHaDF0ArNipAFyqI',
    sortOrder: 1,
  },
  {
    systemName: 'Standard operating procedures (SOPs) for technicians',
    type: 'video',
    title: 'YouTube Training: Standard Operating Procedures',
    description: 'Full YouTube playlist on building and implementing SOPs for service teams.',
    url: 'https://www.youtube.com/playlist?list=PL1NdI7-ewuROSz1iMl211LU0s3wlukGaS',
    sortOrder: 1,
  },
  {
    systemName: 'Owner working ON the business, not just IN it',
    type: 'video',
    title: 'YouTube Training: Business Leadership & Growth',
    description: 'YouTube playlist on transitioning from working in the business to leading and growing it.',
    url: 'https://www.youtube.com/watch?v=i4HDrJ1EQAs&list=PL1NdI7-ewuROijUvyx1GQK5IUOUF78OmO',
    sortOrder: 1,
  },
];

async function seedLearningResources() {
  try {
    const existingCount = await LearningResource.countDocuments();
    if (existingCount > 0) {
      logger.info(`Learning resources already seeded (${existingCount} found)`);
      return;
    }

    const systemNames = learningResources.map((r) => r.systemName);
    const systems = await ScorecardSystem.find({ name: { $in: systemNames }, isActive: true }).lean();
    const systemByName = {};
    for (const sys of systems) {
      systemByName[sys.name] = sys;
    }

    const resourcesToCreate = [];
    for (const item of learningResources) {
      const system = systemByName[item.systemName];
      if (!system) {
        logger.warn(`System not found for resource "${item.title}", skipping`);
        continue;
      }
      resourcesToCreate.push({
        systemId: system._id,
        type: item.type,
        title: item.title,
        description: item.description,
        url: item.url,
        sortOrder: item.sortOrder,
      });
    }

    if (resourcesToCreate.length > 0) {
      await LearningResource.insertMany(resourcesToCreate);
      logger.info(`Seeded ${resourcesToCreate.length} learning resources`);
    }
  } catch (err) {
    logger.error('Error seeding learning resources:', err.message);
  }
}

module.exports = { seedScorecardSystems, seedLearningResources };
