import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { request } from 'graphql-request'

import * as H from './hello'

const store = new H.HelloStore()

// request('http://localhost:4000', `{ name }`).then(data => {
//   // console.log(data)
//   store.who = (data as any).name
// })

const ResourceFields = `{type, url, previewUrl, title, description}`
const LocationFields = `{name, lat, lon}`
const ActivityFields = `{id, type, resources ${ResourceFields}, intro, location ${LocationFields}}`
const CriterionFields = `{type, min, max, text}`
const UnitFields = `{
  id,
  goal,
  benefits,
  justification,
  activities ${ActivityFields},
  criteria ${CriterionFields}
}`

request('http://localhost:4000', `{ units ${UnitFields} }`).then(units => {
  console.log(units)
})

ReactDOM.render(
  <H.Hello store={store} />,
  document.getElementById('root')
)
