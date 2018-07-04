import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { request } from 'graphql-request'

import * as H from './hello'

const store = new H.HelloStore()

request('https://api.graph.cool/simple/v1/movies', `{
  Movie(title: "Inception") {
    releaseDate
    actors {
      name
    }
  }
}`).then(data => {
  // console.log(data)
  store.who = (data as any).Movie.actors[0].name
})

ReactDOM.render(
  <H.Hello store={store} />,
  document.getElementById('root')
)
