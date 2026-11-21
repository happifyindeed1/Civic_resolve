/**
 * CivicResolve: Realistic Pre-Seeded Civic Grievance Dataset
 * Contains 8 diverse issues across departments, urgencies, and lifecycle stages.
 */

export const INITIAL_ISSUES = [
  {
    id: "civic-101",
    ticketNumber: "CR-2026-0841",
    title: "Dangerous 2-Foot Sinkhole Expanding on Metro Station Approach",
    description: "A deep sinkhole has opened up on the main road just 50 meters before the Central Metro Station bus bay. Asphalt has caved in, exposing underlying gravel and sub-base. Vehicles are swerving abruptly into oncoming lanes to avoid it. Rainwater is accumulating, accelerating the collapse.",
    category: "ROADS_BRIDGES",
    urgency: "CRITICAL",
    status: "IN_PROGRESS",
    department: "Department of Public Works",
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "420 Market Street, Near Central Metro Transit Hub",
      landmark: "Opposite Metro Station Exit 2",
      wardOrDistrict: "District 6 - Downtown Central"
    },
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    reportedBy: {
      name: "Marcus Vance",
      phone: "+1 (555) 234-5678",
      email: "marcus.v@example.com"
    },
    assignedTo: {
      officerName: "Officer Marcus Chen",
      badgeId: "DPW-774",
      department: "Department of Public Works"
    },
    upvotes: 42,
    upvotedBy: ["user-1", "user-2", "user-4", "user-7"],
    aiTriage: {
      category: "ROADS_BRIDGES",
      urgency: "CRITICAL",
      department: "Department of Public Works",
      estimatedSla: "6 - 12 Hours",
      publicHazardScore: 9,
      hazardAssessment: "Severe risk of high-speed vehicular wheel entrapment and collision at busy transit node.",
      aiReasoning: "Visual and textual analysis reveals acute asphalt collapse exceeding 2ft diameter on a multi-lane arterial road. Designated as emergency safety hazard with priority barrier placement required.",
      modelUsed: "Google Gemini 2.5 Flash",
      confidence: 0.98,
      isAiGenerated: true
    },
    timeline: [
      {
        id: "tl-101-1",
        stage: "REPORTED",
        actor: "Marcus Vance",
        actorRole: "CITIZEN",
        action: "Grievance submitted with photographic evidence and GPS location.",
        notes: "Citizen reported via mobile browser.",
        timestamp: "2026-11-20T14:32:00Z"
      },
      {
        id: "tl-101-2",
        stage: "TRIAGED",
        actor: "Gemini AI & Commissioner Davis",
        actorRole: "ADMIN",
        action: "Automated AI triage verified; routed to DPW Rapid Response unit.",
        notes: "Urgency validated as CRITICAL due to bus transit corridor impact.",
        timestamp: "2026-11-20T14:35:12Z"
      },
      {
        id: "tl-101-3",
        stage: "IN_PROGRESS",
        actor: "Officer Marcus Chen",
        actorRole: "FIELD_OFFICER",
        action: "Crews dispatched with safety cones and flashing warning arrow boards.",
        notes: "Excavation and sub-base backfill scheduled for 09:00 AM.",
        timestamp: "2026-11-20T16:10:00Z"
      }
    ],
    createdAt: "2026-11-20T14:32:00Z",
    updatedAt: "2026-11-20T16:10:00Z"
  },
  {
    id: "civic-102",
    ticketNumber: "CR-2026-0842",
    title: "Storm-Damaged Live High Voltage Wire Hanging Over Children's Park Path",
    description: "Following yesterday's windstorm, a tree limb snapped an overhead power feeder. The insulated cable is sagging to approximately 4 feet off the pavement right beside the playground swings. Sparks were observed when wind blew the line against a chain-link fence.",
    category: "ELECTRICAL_LIGHTING",
    urgency: "CRITICAL",
    status: "REPORTED",
    department: "City Power & Street Lighting",
    location: {
      lat: 37.7699,
      lng: -122.4467,
      address: "185 Oakwood Drive, Buena Vista Park North Entrance",
      landmark: "Adjacent to playground swing set",
      wardOrDistrict: "District 5 - Western Parkside"
    },
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
    reportedBy: {
      name: "Elena Rostova",
      phone: "+1 (555) 987-6543",
      email: "elena.r@example.com"
    },
    upvotes: 68,
    upvotedBy: ["user-1", "user-3", "user-5", "user-8", "user-9"],
    aiTriage: {
      category: "ELECTRICAL_LIGHTING",
      urgency: "CRITICAL",
      department: "City Power & Street Lighting",
      estimatedSla: "2 - 4 Hours",
      publicHazardScore: 10,
      hazardAssessment: "Immediate life-safety electrocution and brushfire hazard in high-density child pedestrian area.",
      aiReasoning: "Multimodal detection flagged hanging electrical line with sparking contact against grounded perimeter fence. Automated instant escalation to City Power high-voltage emergency crew.",
      modelUsed: "Google Gemini 2.5 Flash",
      confidence: 0.99,
      isAiGenerated: true
    },
    timeline: [
      {
        id: "tl-102-1",
        stage: "REPORTED",
        actor: "Elena Rostova",
        actorRole: "CITIZEN",
        action: "Emergency civic report submitted with photo.",
        notes: "Reported as active sparking hazard.",
        timestamp: "2026-11-21T07:15:00Z"
      }
    ],
    createdAt: "2026-11-21T07:15:00Z",
    updatedAt: "2026-11-21T07:15:00Z"
  },
  {
    id: "civic-103",
    ticketNumber: "CR-2026-0839",
    title: "12-Inch Ruptured Water Main Flooding Elm Avenue Commercial Street",
    description: "Water is gushing out from under the curb at approximately 50 gallons per minute, flooding two lanes of Elm Street. Water pressure in surrounding businesses has dropped to zero. Basements of two adjacent retail shops are beginning to take on water.",
    category: "WATER_SEWERAGE",
    urgency: "HIGH",
    status: "TRIAGED",
    department: "Water Supply & Sewerage Authority",
    location: {
      lat: 37.7833,
      lng: -122.4167,
      address: "712 Elm Avenue & 4th Street",
      landmark: "Outside City Central Bakery",
      wardOrDistrict: "District 3 - Commercial Corridor"
    },
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    reportedBy: {
      name: "Tariq Mansoor",
      phone: "+1 (555) 456-7890",
      email: "tariq.m@business.org"
    },
    assignedTo: {
      officerName: "Supervisor Dave Miller",
      badgeId: "WSA-204",
      department: "Water Supply & Sewerage Authority"
    },
    upvotes: 31,
    upvotedBy: ["user-2", "user-3", "user-6"],
    aiTriage: {
      category: "WATER_SEWERAGE",
      urgency: "HIGH",
      department: "Water Supply & Sewerage Authority",
      estimatedSla: "8 - 16 Hours",
      publicHazardScore: 8,
      hazardAssessment: "High volume drinking water loss and structural erosion of sub-road pavement; commercial flooding risk.",
      aiReasoning: "Identified pressurized water main breach causing substantial surface runoff and property inundation risk. Recommended immediate valve shutoff and hydraulic repair.",
      modelUsed: "Google Gemini 2.5 Flash",
      confidence: 0.96,
      isAiGenerated: true
    },
    timeline: [
      {
        id: "tl-103-1",
        stage: "REPORTED",
        actor: "Tariq Mansoor",
        actorRole: "CITIZEN",
        action: "Grievance submitted.",
        notes: "Business owner reported flooding.",
        timestamp: "2026-11-20T11:00:00Z"
      },
      {
        id: "tl-103-2",
        stage: "TRIAGED",
        actor: "City Triage Admin",
        actorRole: "ADMIN",
        action: "Reviewed and routed to WSA Emergency Repair Crew.",
        notes: "Gate valve isolations mapped.",
        timestamp: "2026-11-20T11:22:00Z"
      }
    ],
    createdAt: "2026-11-20T11:00:00Z",
    updatedAt: "2026-11-20T11:22:00Z"
  },
  {
    id: "civic-104",
    ticketNumber: "CR-2026-0835",
    title: "Overflowing Commercial Dumpsters Blocking Fire Hydrant & Walkway",
    description: "Four commercial waste dumpsters behind the market square have not been emptied in over 5 days. Garbage is spilling across the sidewalk and directly encasing a city fire hydrant. Strong foul odor, swarms of flies, and rodents observed.",
    category: "SANITATION_WASTE",
    urgency: "HIGH",
    status: "IN_PROGRESS",
    department: "Municipal Sanitation Board",
    location: {
      lat: 37.7550,
      lng: -122.4200,
      address: "108 Mission Plaza Alleyway",
      landmark: "Behind Mercado Fresh Market",
      wardOrDistrict: "District 9 - Mission District"
    },
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
    reportedBy: {
      name: "Sofia Morales",
      phone: "+1 (555) 789-0123",
      email: "sofia.m@example.com"
    },
    assignedTo: {
      officerName: "Inspector Raj Patel",
      badgeId: "MSB-412",
      department: "Municipal Sanitation Board"
    },
    upvotes: 27,
    upvotedBy: ["user-1", "user-7", "user-10"],
    aiTriage: {
      category: "SANITATION_WASTE",
      urgency: "HIGH",
      department: "Municipal Sanitation Board",
      estimatedSla: "12 - 24 Hours",
      publicHazardScore: 7,
      hazardAssessment: "Critical fire hydrant obstruction violates municipal safety code; public biohazard from pest vector proliferation.",
      aiReasoning: "Classified as High urgency due to fire hydrant blockage and bio-sanitation compliance violations. Prioritized for special compactor truck and sanitary washdown.",
      modelUsed: "Google Gemini 2.5 Flash",
      confidence: 0.95,
      isAiGenerated: true
    },
    timeline: [
      {
        id: "tl-104-1",
        stage: "REPORTED",
        actor: "Sofia Morales",
        actorRole: "CITIZEN",
        action: "Grievance submitted.",
        notes: "Photo showing blocked red hydrant.",
        timestamp: "2026-11-19T16:45:00Z"
      },
      {
        id: "tl-104-2",
        stage: "TRIAGED",
        actor: "Commissioner Davis",
        actorRole: "ADMIN",
        action: "Sanitation Board notified with fire safety citation warning.",
        timestamp: "2026-11-19T17:10:00Z"
      },
      {
        id: "tl-104-3",
        stage: "IN_PROGRESS",
        actor: "Inspector Raj Patel",
        actorRole: "FIELD_OFFICER",
        action: "Heavy truck unit en route for clearance and container replacement.",
        timestamp: "2026-11-20T08:30:00Z"
      }
    ],
    createdAt: "2026-11-19T16:45:00Z",
    updatedAt: "2026-11-20T08:30:00Z"
  },
  {
    id: "civic-105",
    ticketNumber: "CR-2026-0830",
    title: "Cluster of 3 Dead Streetlights Creating Dark Corridor Near Elementary School",
    description: "Three consecutive LED streetlights on Jefferson Way have been completely non-functional for three nights. The pedestrian crosswalk where children cross for morning school bus pickup is plunged into total darkness.",
    category: "ELECTRICAL_LIGHTING",
    urgency: "MEDIUM",
    status: "TRIAGED",
    department: "City Power & Street Lighting",
    location: {
      lat: 37.7950,
      lng: -122.4050,
      address: "340 Jefferson Way & Columbus Ave",
      landmark: "Near St. Matthew Elementary School",
      wardOrDistrict: "District 2 - North Beach"
    },
    imageUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    reportedBy: {
      name: "David Kim",
      phone: "+1 (555) 345-6789",
      email: "david.kim@pta-school.org"
    },
    upvotes: 19,
    upvotedBy: ["user-4", "user-5"],
    aiTriage: {
      category: "ELECTRICAL_LIGHTING",
      urgency: "MEDIUM",
      department: "City Power & Street Lighting",
      estimatedSla: "24 - 48 Hours",
      publicHazardScore: 6,
      hazardAssessment: "Pedestrian collision risk during early morning and evening hours in designated school transit zone.",
      aiReasoning: "Multiple consecutive fixture failures indicate potential localized photocell or circuit breaker trip rather than individual lamp burnouts.",
      modelUsed: "Google Gemini 2.5 Flash",
      confidence: 0.94,
      isAiGenerated: true
    },
    timeline: [
      {
        id: "tl-105-1",
        stage: "REPORTED",
        actor: "David Kim",
        actorRole: "CITIZEN",
        action: "Report submitted.",
        notes: "School PTA representative.",
        timestamp: "2026-11-19T20:15:00Z"
      },
      {
        id: "tl-105-2",
        stage: "TRIAGED",
        actor: "City Triage Admin",
        actorRole: "ADMIN",
        action: "Assigned to street lighting luminaire technician queue.",
        timestamp: "2026-11-20T09:00:00Z"
      }
    ],
    createdAt: "2026-11-19T20:15:00Z",
    updatedAt: "2026-11-20T09:00:00Z"
  },
  {
    id: "civic-106",
    ticketNumber: "CR-2026-0822",
    title: "Clogged Storm Drain Inlets Causing Street Ponding and Mosquito Breeding",
    description: "Two storm drainage grates at the bottom of the hill are completely choked with decomposed leaves, plastic bottles, and silt. Stagnant foul-smelling water has pooled 4 inches deep across the curb, making sidewalk crossing impossible.",
    category: "WATER_SEWERAGE",
    urgency: "MEDIUM",
    status: "REPORTED",
    department: "Water Supply & Sewerage Authority",
    location: {
      lat: 37.7600,
      lng: -122.4350,
      address: "512 Castro Terrace",
      landmark: "Corner of Castro & 18th",
      wardOrDistrict: "District 8 - Castro"
    },
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
    reportedBy: {
      name: "Hannah Lee",
      phone: "+1 (555) 678-9012",
      email: "hannah.l@example.com"
    },
    upvotes: 14,
    upvotedBy: ["user-3", "user-8"],
    aiTriage: {
      category: "WATER_SEWERAGE",
      urgency: "MEDIUM",
      department: "Water Supply & Sewerage Authority",
      estimatedSla: "36 - 48 Hours",
      publicHazardScore: 5,
      hazardAssessment: "Pedestrian slip hazard and localized vehicle hydroplaning risk during precipitation.",
      aiReasoning: "Identified debris-occluded catch basins requiring vacuum truck jetting and grate clearance.",
      modelUsed: "Google Gemini 2.5 Flash",
      confidence: 0.92,
      isAiGenerated: true
    },
    timeline: [
      {
        id: "tl-106-1",
        stage: "REPORTED",
        actor: "Hannah Lee",
        actorRole: "CITIZEN",
        action: "Grievance submitted with image.",
        timestamp: "2026-11-18T15:20:00Z"
      }
    ],
    createdAt: "2026-11-18T15:20:00Z",
    updatedAt: "2026-11-18T15:20:00Z"
  },
  {
    id: "civic-107",
    ticketNumber: "CR-2026-0810",
    title: "Deep Pothole on Pine Street Restored and Resurfaced",
    description: "A severe 8-inch deep crater on Pine Street had caused multiple punctured tires and popped hubcaps over the weekend.",
    category: "ROADS_BRIDGES",
    urgency: "HIGH",
    status: "RESOLVED",
    department: "Department of Public Works",
    location: {
      lat: 37.7900,
      lng: -122.4100,
      address: "880 Pine Street",
      landmark: "Near Grace Cathedral",
      wardOrDistrict: "District 3 - Nob Hill"
    },
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    afterImageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80",
    resolutionNotes: "DPW Rapid Asphalt Crew milled the damaged surface to a depth of 4 inches, applied tack coat sealant, and placed hot asphalt mix compacted to 98% density. Thermal infrared joint sealing completed. Road reopened to traffic.",
    reportedBy: {
      name: "Arthur Pendelton",
      phone: "+1 (555) 123-4567",
      email: "arthur.p@example.com"
    },
    assignedTo: {
      officerName: "Officer Marcus Chen",
      badgeId: "DPW-774",
      department: "Department of Public Works"
    },
    upvotes: 56,
    upvotedBy: ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"],
    aiTriage: {
      category: "ROADS_BRIDGES",
      urgency: "HIGH",
      department: "Department of Public Works",
      estimatedSla: "24 Hours",
      publicHazardScore: 7,
      hazardAssessment: "High risk of vehicle tire blowout and sudden collision.",
      aiReasoning: "Severe pothole verified. Rapid dispatch issued under city pavement warranty program.",
      modelUsed: "Google Gemini 2.5 Flash",
      confidence: 0.97,
      isAiGenerated: true
    },
    timeline: [
      {
        id: "tl-107-1",
        stage: "REPORTED",
        actor: "Arthur Pendelton",
        actorRole: "CITIZEN",
        action: "Complaint registered with damage photos.",
        timestamp: "2026-11-17T08:10:00Z"
      },
      {
        id: "tl-107-2",
        stage: "TRIAGED",
        actor: "Commissioner Davis",
        actorRole: "ADMIN",
        action: "Triage confirmed; priority work-order assigned.",
        timestamp: "2026-11-17T08:25:00Z"
      },
      {
        id: "tl-107-3",
        stage: "IN_PROGRESS",
        actor: "Officer Marcus Chen",
        actorRole: "FIELD_OFFICER",
        action: "Paving crew on-site with hot asphalt roller.",
        timestamp: "2026-11-17T11:00:00Z"
      },
      {
        id: "tl-107-4",
        stage: "RESOLVED",
        actor: "Officer Marcus Chen",
        actorRole: "FIELD_OFFICER",
        action: "Patching completed and inspected. Before/After proof attached.",
        notes: "Milled, asphalted, and compacted to city standard.",
        timestamp: "2026-11-17T14:45:00Z"
      },
      {
        id: "tl-107-5",
        stage: "VERIFIED",
        actor: "Arthur Pendelton",
        actorRole: "CITIZEN",
        action: "Citizen verified smooth road surface and rated 5 stars.",
        notes: "Outstanding turnaround time! The road is completely smooth now.",
        timestamp: "2026-11-17T16:30:00Z"
      }
    ],
    satisfactionRating: {
      rating: 5,
      feedback: "Outstanding turnaround time! Fixed cleanly within 6 hours of reporting. Very impressed with the rapid notification updates.",
      submittedAt: "2026-11-17T16:30:00Z"
    },
    createdAt: "2026-11-17T08:10:00Z",
    updatedAt: "2026-11-17T16:30:00Z"
  },
  {
    id: "civic-108",
    ticketNumber: "CR-2026-0805",
    title: "Overgrown Tree Canopy Obstructing Stop Sign and Street Name Plaque",
    description: "Thick untrimmed acacia branches from the sidewalk park strip are completely covering the arterial STOP sign on northbound 22nd Street. Motorists unaware of the intersection are sailing through without stopping.",
    category: "PARKS_RECREATION",
    urgency: "MEDIUM",
    status: "REPORTED",
    department: "Parks & Urban Forestry Dept",
    location: {
      lat: 37.7580,
      lng: -122.4150,
      address: "2480 22nd Street & Bryant",
      landmark: "Intersection of 22nd & Bryant",
      wardOrDistrict: "District 9 - Mission / Potrero"
    },
    imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
    reportedBy: {
      name: "Mateo Alvarez",
      phone: "+1 (555) 890-1234",
      email: "mateo.a@example.com"
    },
    upvotes: 11,
    upvotedBy: ["user-2", "user-5"],
    aiTriage: {
      category: "PARKS_RECREATION",
      urgency: "MEDIUM",
      department: "Parks & Urban Forestry Dept",
      estimatedSla: "36 - 48 Hours",
      publicHazardScore: 6,
      hazardAssessment: "Visual occlusion of regulatory traffic control sign creates severe T-bone collision hazard.",
      aiReasoning: "Identified dense arboricultural obstruction over mandated traffic regulatory sign. High safety impact despite belonging to municipal tree maintenance.",
      modelUsed: "Google Gemini 2.5 Flash",
      confidence: 0.94,
      isAiGenerated: true
    },
    timeline: [
      {
        id: "tl-108-1",
        stage: "REPORTED",
        actor: "Mateo Alvarez",
        actorRole: "CITIZEN",
        action: "Grievance submitted with photo showing covered stop sign.",
        timestamp: "2026-11-16T12:00:00Z"
      }
    ],
    createdAt: "2026-11-16T12:00:00Z",
    updatedAt: "2026-11-16T12:00:00Z"
  }
];
