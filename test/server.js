var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('../webpack.config');

const { GraphQLServer } = require('graphql-yoga')

const typeDefs = `
type Query {
  description: String
}
`

const resolvers = {
  Query: {
    description: () => `This is a test of the Emergency GraphQL Broadcast System`
  }
}

const server = new GraphQLServer({
  typeDefs,
  resolvers
})

server.start(() => console.log(`The server is running on http://localhost:4000`))

// new WebpackDevServer(webpack(config), {
//   publicPath: config.output.publicPath,
//   hot: false,
//   historyApiFallback: true
// }).listen(3000, 'localhost', function (err, result) {
//   if (err) {
//     console.log(err);
//   }

//   console.log('Listening at localhost:3000');
// });
