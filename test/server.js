const { GraphQLServer } = require('graphql-yoga')

const typeDefs = `
type Query {
  name :String
  description: String
}
`

const resolvers = {
  Query: {
    name: () => `Mr GraphQL`,
    description: () => `This is a test of the Emergency GraphQL Broadcast System`
  }
}

const server = new GraphQLServer({
  typeDefs,
  resolvers
})

server.start(() => console.log(`GraphQL server running on http://localhost:4000`))

var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('../webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: false,
  historyApiFallback: true
}).listen(3000, 'localhost', function (err, result) {
  if (err) {
    console.log(err);
  }

  console.log('Webpack Dev server running on http://localhost:3000');
});
