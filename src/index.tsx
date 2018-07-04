import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { request } from 'graphql-request'

import * as H from './hello'

const store = new H.HelloStore()

request('http://localhost:4000', `{ name }`).then(data => {
  // console.log(data)
  store.who = (data as any).name
})

ReactDOM.render(
  <H.Hello store={store} />,
  document.getElementById('root')
)
