import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as H from './hello'

const store = new H.HelloStore()

ReactDOM.render(
  <H.Hello store={store} />,
  document.getElementById('root')
)
