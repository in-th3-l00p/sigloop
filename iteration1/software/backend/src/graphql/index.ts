import { Hono } from "hono"
import { createYoga, createSchema } from "graphql-yoga"
import { typeDefs } from "./schema.js"
import { createResolvers, type ResolversDeps } from "./resolvers.js"

export function createGraphQLHandler(deps: ResolversDeps) {
  const resolvers = createResolvers(deps)
  const app = new Hono()

  const yoga = createYoga({
    schema: createSchema({
      typeDefs,
      resolvers: resolvers as any,
    }),
    graphqlEndpoint: "/graphql",
    landingPage: false,
  })

  app.all("/*", async (c) => {
    const response = await yoga.handle(c.req.raw)
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  })

  return app
}
