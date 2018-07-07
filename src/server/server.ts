// needed (once for whole app) for class-transformer to do its job
import "reflect-metadata"

import { buildSchema } from 'type-graphql'
import { GraphQLServer } from "graphql-yoga"
import { UnitResolver } from "./units"

async function startServer () {
  const schema = await buildSchema({
    resolvers: [UnitResolver]
  });

  const server = new GraphQLServer({schema})

  server.start(() => console.log(`GraphQL server running on http://localhost:4000`))
}

startServer().catch(error => console.warn(error))
