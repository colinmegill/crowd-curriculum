import { ObjectType, Field, ID, Int, Resolver, Query, registerEnumType } from 'type-graphql'
import { plainToClass } from "class-transformer"

export enum CriterionType {
  AGE,
  INTEREST,
  // ...
  CUSTOM
}

registerEnumType(CriterionType, {
  name: "CriterionType",
  description: "Enumerates types of criteria",
});

@ObjectType()
export class Criterion {
  @Field(type => CriterionType)
  type :CriterionType
  @Field(type => Int, {nullable: true})
  min? :number
  @Field(type => Int, {nullable: true})
  max? :number
  @Field(type => String, {nullable: true})
  text? :string
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
  description: "Enumerates types of resources",
});

@ObjectType()
export class Resource {
  @Field(type => ResourceType)
  type :ResourceType
  // pretty much everything here is optional as different resources will have some subset
  // of these various attributes
  @Field(type => String, {nullable: true})
  url? :string
  @Field(type => String, {nullable: true})
  previewUrl? :string
  @Field(type => String, {nullable: true})
  title? :string
  @Field(type => String, {nullable: true})
  description? :string
}

@ObjectType()
export class Location {
  @Field(type => String)
  name :string
  @Field(type => String, {nullable: true})
  lat? :string
  @Field(type => String, {nullable: true})
  lon? :string
}

export enum ActivityType {
  WATCH,
  READ,
  CONSIDER,
  // ...
  CUSTOM
}

registerEnumType(ActivityType, {
  name: "ActivityType",
  description: "Enumerates types of activities",
});

@ObjectType()
export class Activity {
  @Field(type => ID)
  id :string
  @Field(type => ActivityType)
  type :ActivityType
  @Field(type => String, {nullable: true})
  intro? :string
  @Field(type => [Resource])
  resources :Resource[]
  @Field(type => Location, {nullable: true})
  location? :Location
}

@ObjectType()
export class Unit {
  @Field(type => ID)
  id :string
  @Field(type => String)
  goal :string
  @Field(type => String, {nullable: true})
  benefits? :string
  @Field(type => String, {nullable: true})
  justification? :string
  @Field(type => [Criterion])
  criteria :Criterion[]
  @Field(type => [Activity])
  activities :Activity[]
}

export const units :Unit[] = [
  plainToClass(Unit, {
    id: "1",
    goal: "Test all the things",
    criteria: [
      {type: CriterionType.INTEREST, text: "testing"}
    ],
    activities: [
      {id: "1", type: ActivityType.READ, intro: "Read this stuff!", resources: []}
    ]
  })
]

@Resolver(Unit)
export class UnitResolver {

  @Query(returns => [Unit])
  units() :Unit[] {
    return units
  }
}
