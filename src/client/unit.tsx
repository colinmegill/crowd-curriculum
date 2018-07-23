import * as React from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { request } from 'graphql-request'

const GQLEndpoint = 'http://localhost:4000'

// TODO: will probably eventually want to split Unit and UnitList into separate modules

type UnitSummary = {
  id :string,
  goal :string
}

export class UnitListStore {
  @observable loading = true
  @observable units :UnitSummary[] = []

  constructor () {
    // TODO: I don't love that the constructor is making a GraphQL call; need to think about when
    // network requests are initiated
    request(GQLEndpoint, `{ units { id, goal } }`).then((data :any) => {
      // TODO: I don't love that we just cast the results to the right type, but I'm not ready to
      // take on the pain of generating TypeScript stubs from GQL queries and all the build-system
      // bullshit that's going to entail
      this.units = (data.units as UnitSummary[])
      this.loading = false
    })
    // TODO: what if the request fails? error handling, reporting
  }
}

@observer
export class UnitList extends React.Component<{store :UnitListStore}> {

  render () {
    const {loading, units} = this.props.store
    if (loading) return (<div>Loading...</div>)
    else return (
      <div>
        <h3>Units</h3>
        <ul>{units.map(this.renderUnit)}</ul>
      </div>
    )
  }

  renderUnit (sum :UnitSummary) {
    // TODO: do we need to worry about URL encoding the id?
    return (<li key={sum.id}><a href={`#unit-${sum.id}`}>{sum.goal}</a></li>)
  }
}


// TODO: this is seriously annoying; we have to specifically enumerate every single field and
// sub-field and sub-sub-field of Unit that we want to get back for our query; is there a way to
// say "Just give me everything" because otherwise keeping this in sync is going to be painful
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

export class UnitStore {
  constructor (readonly id :string) {
    request(GQLEndpoint, `{ unit(id: "${id}") ${UnitFields} }`).then((data :any) => {
      console.log(data)
    })
  }
  // TODO
}

@observer
export class Unit extends React.Component<{store :UnitStore}> {

  render () {
    const {id} = this.props.store
    return (<div>TODO: {id}</div>)
  }
}
