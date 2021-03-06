import {
  Mutation,
  InputType,
  ObjectType,
  Field,
  ID,
  Int,
  Resolver,
  Query,
  Arg,
  registerEnumType
} from "type-graphql";
import { plainToClass } from "class-transformer";

export enum CriterionType {
  AGE,
  INTEREST,
  // ...
  CUSTOM
}

registerEnumType(CriterionType, {
  name: "CriterionType",
  description: "Enumerates types of criteria"
});

@ObjectType()
export class Criterion {
  @Field(type => CriterionType)
  type: CriterionType;
  @Field(type => Int, { nullable: true })
  min?: number;
  @Field(type => Int, { nullable: true })
  max?: number;
  @Field(type => String, { nullable: true })
  text?: string;
}

@InputType()
export class CriterionInput implements Partial<Criterion> {
  @Field(type => CriterionType)
  type: CriterionType;
  @Field(type => Int, { nullable: true })
  min?: number;
  @Field(type => Int, { nullable: true })
  max?: number;
  @Field(type => String, { nullable: true })
  text?: string;
}

enum ResourceType {
  PAGE,
  VIDEO,
  MOVIE,
  BOOK
  // ...
}

registerEnumType(ResourceType, {
  name: "ResourceType",
  description: "Enumerates types of resources"
});

@ObjectType()
export class Resource {
  @Field(type => ResourceType)
  type: ResourceType;
  // pretty much everything here is optional as different resources will have some subset
  // of these various attributes
  @Field(type => String, { nullable: true })
  url?: string;
  @Field(type => String, { nullable: true })
  previewUrl?: string;
  @Field(type => String, { nullable: true })
  title?: string;
  @Field(type => String, { nullable: true })
  description?: string;
}

@InputType()
export class ResourceInput implements Partial<Resource> {
  @Field(type => ResourceType)
  type: ResourceType;
  // pretty much everything here is optional as different resources will have some subset
  // of these various attributes
  @Field(type => String, { nullable: true })
  url?: string;
  @Field(type => String, { nullable: true })
  previewUrl?: string;
  @Field(type => String, { nullable: true })
  title?: string;
  @Field(type => String, { nullable: true })
  description?: string;
}

@ObjectType()
export class Location {
  @Field(type => String)
  name: string;
  @Field(type => String, { nullable: true })
  lat?: string;
  @Field(type => String, { nullable: true })
  lon?: string;
}

@InputType()
export class LocationInput implements Partial<Location> {
  @Field(type => String)
  name: string;
  @Field(type => String, { nullable: true })
  lat?: string;
  @Field(type => String, { nullable: true })
  lon?: string;
}

export enum ActivityType {
  WATCH,
  READ,
  CONSIDER,
  DRAW,
  WRITE,
  // ...
  CUSTOM
}

registerEnumType(ActivityType, {
  name: "ActivityType",
  description: "Enumerates types of activities"
});

type ActivityId = string;

@ObjectType()
export class Activity {
  @Field(type => ID)
  id: ActivityId;
  @Field(type => ActivityType)
  type: ActivityType;
  @Field(type => String, { nullable: true })
  title?: string;
  @Field(type => String, { nullable: true })
  intro?: string;
  @Field(type => [Resource])
  resources: Resource[];
  @Field(type => Location, { nullable: true })
  location?: Location;
}

@InputType()
export class ActivityInput implements Partial<Activity> {
  @Field(type => ActivityType)
  type: ActivityType;
  @Field(type => String, { nullable: true })
  title?: string;
  @Field(type => String, { nullable: true })
  intro?: string;
  @Field(type => [ResourceInput])
  resources: ResourceInput[];
  @Field(type => LocationInput, { nullable: true })
  location?: LocationInput;
}

@ObjectType()
export class Details {
  @Field(type => String)
  goal: string;
  @Field(type => String, { nullable: true })
  benefits?: string;
  @Field(type => String, { nullable: true })
  justification?: string;
}

@InputType()
export class DetailsInput implements Partial<Details> {
  @Field(type => String)
  goal: string;
  @Field(type => String, { nullable: true })
  benefits?: string;
  @Field(type => String, { nullable: true })
  justification?: string;
}

// I wish I could annotate this as having GraphQL type "ID"
// and not have to repeat myself a dozen times below
type UnitId = string;

@ObjectType()
export class Unit {
  @Field(type => ID)
  id: UnitId;
  @Field(type => Details)
  details: Details;
  @Field(type => [Criterion])
  criteria: Criterion[];
  @Field(type => [Activity])
  activities: Activity[];
}

export const units: Unit[] = [
  plainToClass(Unit, {
    id: "1",
    details: {
      goal: "Learn about the Titanic",
      benefits:
        "Which is great, because engineering failures teach us a lot about building things."
    },
    criteria: [
      { type: CriterionType.AGE, min: 6, max: 12 },
      { type: CriterionType.INTEREST, text: "engineering" },
      { type: CriterionType.INTEREST, text: "robotics" },
      { type: CriterionType.INTEREST, text: "cartography" }
    ],
    activities: [
      {
        id: "1",
        type: ActivityType.READ,
        intro: "Read this stuff!",
        resources: [
          {
            type: ResourceType.BOOK,
            url:
              "https://www.amazon.com/Tonight-Titanic-Magic-Tree-House/dp/0679890637"
          },
          {
            type: ResourceType.BOOK,
            url:
              "https://www.amazon.com/Titanic-Nonfiction-Companion-Magic-Tonight/dp/0375813578"
          },
          {
            type: ResourceType.BOOK,
            url:
              "https://www.amazon.com/Titanic-Disaster-Turtleback-Library-Binding/dp/0606238115"
          },
          {
            type: ResourceType.BOOK,
            url:
              "https://www.amazon.com/You-Wouldnt-Want-Sail-Titanic/dp/0531245055"
          }
        ]
      },
      {
        id: "2",
        type: ActivityType.WATCH,
        intro:
          "Many of the documentaries about the Titanic are sensationalist. " +
          "Titanic: The Complete Story parts I & II instead seek to inform, and tell the story " +
          "thoroughly and carefully. They are older but, because of that, feature lots of original " +
          "eye witness testimony from those who survived as children and young adults.",
        resources: [
          {
            type: ResourceType.VIDEO,
            url: "https://www.youtube.com/watch?v=NC_xDKMKl9w"
          },
          {
            type: ResourceType.VIDEO,
            url: "https://www.youtube.com/watch?v=4Hg9JJgjo08"
          }
        ]
      },
      {
        id: "3",
        type: ActivityType.WATCH,
        intro:
          "This documentary tells the story of Robert Ballard as he searches for and " +
          "discovers the Titanic. Also you get to meet Alvin.",
        resources: [
          {
            type: ResourceType.VIDEO,
            url: "https://www.youtube.com/watch?v=NrahF3opykM"
          },
          {
            type: ResourceType.VIDEO,
            url: "https://www.youtube.com/watch?v=rg9NnS3c1CQ"
          }
        ]
      },
      {
        id: "4",
        type: ActivityType.DRAW,
        intro:
          "Try drawing the ship quickly three times, then develop one of your drawings into " +
          "a more detailed drawing. Some things to think about as you start to draw: where was " +
          "the ship in its journey in this drawing? What does the environment around the ship " +
          "look like (city & construction, picking up passengers, open sea, iceberg, bottom of " +
          "the ocean)? Pay attention to details of the ship from photographs you can find " +
          "online - how many smokestacks does it have? Are there cables or wires? Is your drawing " +
          "of the outside or can you see the inside as well?",
        resources: []
      },
      {
        id: "5",
        type: ActivityType.WRITE,
        intro:
          "Describe why the people who built it though it couldn't sink. What engineering " +
          "features did it have that were meant to prevent this from happening? Why were they " +
          "wrong? What decisions could you have made differently?",
        resources: []
      },
      {
        id: "6",
        type: ActivityType.WRITE,
        intro:
          "Describe the journey taken by Alvin. What can Alvin do? What features allow " +
          "Alvin to do what it can do?",
        resources: []
      },
      {
        id: "7",
        type: ActivityType.CUSTOM,
        title:
          "Plot" /* this doesn't make it through currently, the title is actually 'CUSTOM' */,
        intro:
          "41.726931° N and -49.948253° W\n\n" +
          "This is where the Titanic is. Plot this on a map. If you're unfamiliar with latitude & " +
          "longitude [learn about that first](). Then plot origin & destination.",
        resources: [
          // TODO: resources that include a link to the world map on which they'll plot
        ]
      },
      {
        id: "8",
        type: ActivityType.CUSTOM,
        title: "Go find out",
        intro: "How did the Titanic communicate with other ships?",
        resources: []
      }
    ]
  }),
  plainToClass(Unit, {
    id: "2",
    details: {
      goal: "learn about tower sails, planes without wings & the magnus effect",
      benefits:
        "Which is great, because both tower sails and wingless aircraft use interesting physics and container ships with tower sails reduce reliance on diesel."
    },
    criteria: [
      { type: CriterionType.AGE, min: 12, max: 99 },
      { type: CriterionType.INTEREST, text: "engineering" },
      { type: CriterionType.INTEREST, text: "sailing" },
      { type: CriterionType.INTEREST, text: "flight" },
      { type: CriterionType.INTEREST, text: "aeronautics" },
      { type: CriterionType.INTEREST, text: "physics" },
      { type: CriterionType.INTEREST, text: "math" },
      { type: CriterionType.INTEREST, text: "magus" },
      { type: CriterionType.INTEREST, text: "magus effect" }
    ],
    activities: [
      {
        id: "1",
        type: ActivityType.WATCH,
        intro:
          "First, let's pique our interests. Why on earth does the following happen?",
        resources: [
          {
            type: ResourceType.VIDEO,
            url: "https://www.youtube.com/watch?v=QtP_bh2lMXc"
          }
        ]
      },
      {
        id: "2",
        type: ActivityType.WATCH,
        intro: "These two videos give a cursory explanation.",
        resources: [
          {
            type: ResourceType.VIDEO,
            url: "https://www.youtube.com/watch?v=2OSrvzNW9FE"
          },
          {
            type: ResourceType.VIDEO,
            url: "https://www.youtube.com/watch?v=23f1jvGUWJs"
          }
        ]
      },
      {
        id: "3",
        type: ActivityType.WATCH,
        intro:
          "There are surprising industrial applications of the magnus effect: sails for container ships.",
        resources: [
          {
            type: ResourceType.VIDEO,
            url: "https://youtu.be/aQXp75Qt99M?t=1m9s"
          }
        ]
      },
      {
        id: "4",
        type: ActivityType.READ,
        intro: "Articles about industrial applications of the magus effect",
        resources: [
          {
            type: ResourceType.BOOK,
            url:
              "https://www.mpropulsion.com/news/view,finns-harness-sail-power-on-maersk-tanker_54046.htm"
          },
          {
            type: ResourceType.BOOK,
            url:
              "https://www.theguardian.com/environment/2017/mar/14/spinning-sail-reboot-cut-fuel-make-ocean-tankers-greener"
          }
        ]
      },
      {
        id: "5",
        type: ActivityType.READ,
        intro:
          "Now that you're hopefully sufficiently convinced of its intrigue and utility... read the wikipedia page on the magnus effect & flettner rotor.",
        resources: [
          {
            type: ResourceType.PAGE,
            url: "https://en.wikipedia.org/wiki/Magnus_effect"
          },
          {
            type: ResourceType.PAGE,
            url: "https://en.wikipedia.org/wiki/Flettner_rotor"
          }
        ]
      },
      {
        id: "6",
        type: ActivityType.CUSTOM,
        title:
          "Explore" /* this doesn't make it through currently, the title is actually 'CUSTOM' */,
        intro:
          "In the videos above, you heard mention of Newton's third law - the object acts on the air and the air acts back on the object, causing it to move in a direction. Explore its implications here:",
        resources: [
          {
            type: ResourceType.PAGE,
            url:
              "https://www.physicsclassroom.com/class/newtlaws/Lesson-4/Newton-s-Third-Law"
          }
        ]
      },
      {
        id: "7",
        type: ActivityType.CUSTOM,
        title:
          "Solve" /* this doesn't make it through currently, the title is actually 'CUSTOM' */,
        intro:
          "Here's an MIT open courseware unit that describes the math behind the magnus effect. Also included is the context this particular exercise is drawn from, if you want to do the background work as well.",
        resources: [
          {
            type: ResourceType.PAGE,
            url:
              "https://ocw.mit.edu/courses/mechanical-engineering/2-25-advanced-fluid-mechanics-fall-2013/potential-flow-theory/MIT2_25F13_SolutionMagnus.pdf"
          },
          {
            type: ResourceType.PAGE,
            url:
              "https://ocw.mit.edu/courses/mechanical-engineering/2-25-advanced-fluid-mechanics-fall-2013/potential-flow-theory/"
          }
        ]
      },
      {
        id: "8",
        type: ActivityType.WATCH,
        intro: "A wonderful little model aircraft powered by this effect.",
        resources: [
          {
            type: ResourceType.VIDEO,
            url: "https://www.youtube.com/watch?v=GAqLyyg2AHk"
          }
        ]
      },
      {
        id: "9",
        type: ActivityType.READ,
        intro: "There is also intrigue regarding the magnus effect in cricket.",
        resources: [
          {
            type: ResourceType.PAGE,
            url:
              "http://web.archive.org/web/20071018203238/http://www.geocities.com/k_achutarao/MAGNUS/magnus.html"
          }
        ]
      },
      {
        id: "10",
        type: ActivityType.READ,
        intro:
          "A discussion of the Magnus effect & lift, focused on equations.",
        resources: [
          {
            type: ResourceType.PAGE,
            url: "https://www.mathpages.com/home/kmath258/kmath258.htm"
          }
        ]
      }
    ]
  })
];

@Resolver(Unit)
export class UnitResolver {
  // NOTE: the resolver methods are all async because we will eventually be talking to a real
  // database, which will require them to be async; presently they just manipulate temporary
  // in-memory data structures and don't actually need to be async

  @Query(returns => [Unit])
  async units(): Promise<Unit[]> {
    return units;
  }

  @Query(returns => Unit, { nullable: true })
  async unit(@Arg("id") id: string): Promise<Unit | void> {
    return await units.find(unit => unit.id === id);
  }

  @Mutation(returns => Unit)
  async createUnit(@Arg("goal") goal: string): Promise<Unit> {
    // NOTE: for now just use numeric ids; when we have a real database, it will assign ids
    const maxId = units
      .map(u => parseInt(u.id))
      .reduce((i1, i2) => Math.max(i1, i2));
    const unit = new Unit();
    unit.id = `${maxId + 1}`;
    unit.details = { goal };
    units.push(unit);
    return unit;
  }

  // these update methods return undefined/null on success or a string describing the failure in the
  // event of an error; TODO: is this a sensible way to communicate errors from server to client or
  // does GraphQL provide a better mechanism?

  @Mutation(returns => String, { nullable: true })
  async updateDetails(
    @Arg("unitId", type => ID)
    unitId: UnitId,
    @Arg("details") details: DetailsInput
  ): Promise<string | void> {
    return this.updateUnit(unitId, unit => {
      unit.details = details;
    });
  }

  @Mutation(returns => String, { nullable: true })
  async updateCriteria(
    @Arg("unitId", type => ID)
    unitId: UnitId,
    @Arg("criteria", type => [CriterionInput])
    criteria: CriterionInput[]
  ): Promise<string | void> {
    return this.updateUnit(unitId, unit => {
      unit.criteria = criteria;
    });
  }

  @Mutation(returns => String, { nullable: true })
  async addActivity(
    @Arg("goal", type => ID)
    unitId: UnitId,
    @Arg("activity") activity: ActivityInput
  ): Promise<string | void> {
    return this.updateUnit(unitId, unit => {
      // NOTE: for now just use numeric ids; when we have a real database, it will assign ids
      const maxId = unit.activities
        .map(a => parseInt(a.id))
        .reduce((i1, i2) => Math.max(i1, i2));
      unit.activities.push({ id: `${maxId + 1}`, ...activity });
    });
  }

  @Mutation(returns => String, { nullable: true })
  async updateActivity(
    @Arg("unitId", type => ID)
    unitId: UnitId,
    @Arg("activityId", type => ID)
    activityId: ActivityId,
    @Arg("activity") activity: ActivityInput
  ): Promise<string | void> {
    return this.updateUnit(unitId, unit => {
      const activityIdx = unit.activities.findIndex(a => a.id === activityId);
      if (activityIdx < 0) return `No activity with id '${activityId}'`;
      unit.activities[activityIdx] = { id: activityId, ...activity };
      return undefined;
    });
  }

  private updateUnit(unitId: UnitId, op: (unit: Unit) => string | void) {
    const unit = units.find(unit => unit.id === unitId);
    if (unit) return op(unit);
    return `No unit with id '${unitId}'`;
  }
}
