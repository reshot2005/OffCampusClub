export type ClubOnboardingSlug =
  | "sports"
  | "bikers"
  | "music"
  | "photography"
  | "fitness"
  | "fashion";

export type ClubOnboardingQuestion = {
  key: "q1" | "q2" | "q3" | "q4" | "q5";
  prompt: string;
  options: string[];
};

export type ClubOnboardingConfig = {
  slug: ClubOnboardingSlug;
  clubName: string;
  clubIcon: string;
  footerCopy: string;
  questions: ClubOnboardingQuestion[];
};

export const CLUB_ONBOARDING_QUESTIONS: Record<
  ClubOnboardingSlug,
  ClubOnboardingConfig
> = {
  sports: {
    slug: "sports",
    clubName: "Football Club",
    clubIcon: "FC",
    footerCopy: "Personalizing your matchday experience",
    questions: [
      {
        key: "q1",
        prompt: "What position do you naturally drift toward?",
        options: ["Striker", "Midfielder", "Defender", "Goalkeeper"],
      },
      {
        key: "q2",
        prompt: "How often do you play right now?",
        options: [
          "Every weekend",
          "A few times a month",
          "Rarely but I love watching",
          "Just getting started",
        ],
      },
      {
        key: "q3",
        prompt: "What are you most excited about?",
        options: [
          "Joining tournaments",
          "Booking turf with friends",
          "Watching and discussing matches",
          "Learning proper technique",
        ],
      },
      {
        key: "q4",
        prompt: "Which football culture do you vibe with most?",
        options: [
          "Street football energy",
          "Champions League prestige",
          "Local college leagues",
          "Mundial world cup passion",
        ],
      },
      {
        key: "q5",
        prompt: "What do you want from OCC Football Club?",
        options: [
          "Find people to play with regularly",
          "Compete in tournaments",
          "Just enjoy the community",
          "Improve my skills",
        ],
      },
    ],
  },
  bikers: {
    slug: "bikers",
    clubName: "Bikers Club",
    clubIcon: "BK",
    footerCopy: "Setting up your ride profile",
    questions: [
      {
        key: "q1",
        prompt: "How would you describe your riding experience?",
        options: [
          "Long-time rider",
          "Weekend regular",
          "Occasional explorer",
          "Just getting into it",
        ],
      },
      {
        key: "q2",
        prompt: "What kind of machine feels most like you?",
        options: ["Sports bike", "Cruiser", "Adventure bike", "Scooter / city ride"],
      },
      {
        key: "q3",
        prompt: "Which route sounds like your perfect ride?",
        options: [
          "Hill roads at sunrise",
          "City night loops",
          "Highway distance runs",
          "Cafe-hopping day rides",
        ],
      },
      {
        key: "q4",
        prompt: "What is your riding style?",
        options: [
          "Fast and focused",
          "Smooth and scenic",
          "Group pack energy",
          "Solo headspace",
        ],
      },
      {
        key: "q5",
        prompt: "Why are you joining OCC Bikers?",
        options: [
          "Find my riding crew",
          "Discover new routes",
          "Join organized rides",
          "Learn more about biking culture",
        ],
      },
    ],
  },
  music: {
    slug: "music",
    clubName: "Music Club",
    clubIcon: "MU",
    footerCopy: "Tuning your club profile",
    questions: [
      {
        key: "q1",
        prompt: "Where do you fit in the room?",
        options: ["Singer", "Instrumentalist", "Producer / DJ", "Just here for the vibe"],
      },
      {
        key: "q2",
        prompt: "Which sound feels most like you?",
        options: ["Indie / alt", "Hip-hop / rap", "Pop / acoustic", "Electronic / experimental"],
      },
      {
        key: "q3",
        prompt: "What kind of performance energy do you like?",
        options: [
          "Open mics",
          "Studio sessions",
          "Big live sets",
          "Small jam circles",
        ],
      },
      {
        key: "q4",
        prompt: "How much stage experience do you have?",
        options: [
          "Performed a lot",
          "A few times",
          "Mostly private practice",
          "Never, but I want to start",
        ],
      },
      {
        key: "q5",
        prompt: "What do you want most from OCC Music?",
        options: [
          "Meet collaborators",
          "Perform live",
          "Build original work",
          "Explore new sounds",
        ],
      },
    ],
  },
  photography: {
    slug: "photography",
    clubName: "Photography Club",
    clubIcon: "PH",
    footerCopy: "Framing your club experience",
    questions: [
      {
        key: "q1",
        prompt: "What are you usually shooting with?",
        options: ["DSLR / mirrorless", "Film camera", "Phone camera", "Whatever I can get"],
      },
      {
        key: "q2",
        prompt: "Which style pulls you in most?",
        options: ["Street", "Portraits", "Events", "Fashion / editorial"],
      },
      {
        key: "q3",
        prompt: "What do you love pointing the lens at?",
        options: ["People", "Architecture", "Nature", "Movement / action"],
      },
      {
        key: "q4",
        prompt: "How would you describe your experience level?",
        options: [
          "Confident and consistent",
          "Learning quickly",
          "Just experimenting",
          "Mostly editing so far",
        ],
      },
      {
        key: "q5",
        prompt: "What are you hoping OCC Photography gives you?",
        options: [
          "Photo walks and peers",
          "Portfolio growth",
          "Paid shoot opportunities",
          "Feedback and technique",
        ],
      },
    ],
  },
  fitness: {
    slug: "fitness",
    clubName: "Fitness Club",
    clubIcon: "FT",
    footerCopy: "Building your training profile",
    questions: [
      {
        key: "q1",
        prompt: "Where are you in your fitness journey?",
        options: ["Beginner", "Getting consistent", "Already committed", "Athlete mode"],
      },
      {
        key: "q2",
        prompt: "What kind of movement do you enjoy most?",
        options: ["Strength training", "Running / cardio", "Sports conditioning", "Yoga / mobility"],
      },
      {
        key: "q3",
        prompt: "What goal matters most right now?",
        options: ["Get stronger", "Look leaner", "Feel healthier", "Build discipline"],
      },
      {
        key: "q4",
        prompt: "How much time can you realistically give each week?",
        options: ["2-3 sessions", "4-5 sessions", "Daily if needed", "Still figuring it out"],
      },
      {
        key: "q5",
        prompt: "Why OCC Fitness?",
        options: [
          "Need accountability",
          "Want a workout crew",
          "Love challenges",
          "Want coaching and structure",
        ],
      },
    ],
  },
  fashion: {
    slug: "fashion",
    clubName: "Fashion Club",
    clubIcon: "FA",
    footerCopy: "Curating your club profile",
    questions: [
      {
        key: "q1",
        prompt: "What style identity feels closest to you?",
        options: ["Minimal and clean", "Streetwear", "Editorial / runway", "Still discovering it"],
      },
      {
        key: "q2",
        prompt: "Which lane are you most drawn to?",
        options: ["Styling", "Designing", "Modeling", "Creative direction"],
      },
      {
        key: "q3",
        prompt: "What kind of brands catch your eye?",
        options: ["Luxury houses", "Indie labels", "Archive / vintage", "Campus-born brands"],
      },
      {
        key: "q4",
        prompt: "What kind of fashion events sound best?",
        options: [
          "Photoshoots",
          "Pop-up drops",
          "Styling labs",
          "Runway / showcase nights",
        ],
      },
      {
        key: "q5",
        prompt: "What do you want from OCC Fashion?",
        options: [
          "Find creative collaborators",
          "Build a portfolio",
          "Attend standout events",
          "Express my style confidently",
        ],
      },
    ],
  },
};

export function getClubOnboardingConfig(slug: string): ClubOnboardingConfig {
  if (slug in CLUB_ONBOARDING_QUESTIONS) {
    return CLUB_ONBOARDING_QUESTIONS[slug as ClubOnboardingSlug];
  }

  return CLUB_ONBOARDING_QUESTIONS.sports;
}
