import * as React from "react"
import { observable } from "mobx"
import { observer } from "mobx-react"
import { DB } from "./db"
import * as M from "./model"

// TODO: will probably eventually want to split Unit and UnitList into separate modules

type UnitSummary = {
  id :string,
  goal :string
}

export class UnitListStore {
  @observable loading = true
  @observable units :UnitSummary[] = []

  constructor (db :DB) {
    console.log(`Fetching units...`)
    db.units().then(units => {
      this.units = units
      this.loading = false
    }, error => console.warn(error)) // TODO: error handling
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
        {(units.length > 0) ?
        <ul>{units.map(this.renderUnit)}</ul> :
        <p>No units.</p>}
        <button>Create Unit</button>
      </div>
    )
  }

  renderUnit (sum :UnitSummary) {
    // TODO: do we need to worry about URL encoding the id?
    return (<li key={sum.id}><a href={`#unit-${sum.id}`}>{sum.goal}</a></li>)
  }
}

enum Mode { VIEW, EDIT_DETAILS, EDIT_CRITERIA, EDIT_ACTIVITY, ADD_ACTIVITY }

export class UnitStore {
  @observable unit! :M.Unit
  @observable mode :Mode = Mode.VIEW

  constructor (db :DB, readonly id :string) {
    db.unit(id).then(unit => this.unit = unit,
                     error => console.warn(error)) // TODO: error handling
  }

  setMode (mode :Mode) {
    this.mode = mode
  }

  editDetails () {
    this.unit.startEdit()
    this.setMode(Mode.EDIT_DETAILS)
  }

  async saveDetails () {
    this.unit.commitEdit()
    this.setMode(Mode.VIEW)
  }
}

const ACTIVITY_TITLES = {
  WATCH: "Watch",
  READ: "Read",
  CONSIDER: "Consider",
  DRAW: "Draw",
  WRITE: "Write",
  CUSTOM: "Custom"
}

export function renderActivity (activity :M.Activity) {
  return (
    <div key={activity.id}>
    <h2>{activity.title || ACTIVITY_TITLES[activity.type.value]}</h2>
      <p>{activity.intro}</p>
      <ul>{activity.resources.map(renderResource)}</ul>
    </div>
  )
}

function renderResource (resource :M.Resource, index :number) {
  switch (resource.type.value) {
  case 'book':
    // TODO: custom stuffs
  case 'video':
    // TODO: custom stuffs
  default:
    const url = resource.url.value || ""
    return <li key={index}><a href={url}>{url}</a></li>
  }
}

function editString (id :string, prop :M.SimpleProp<string|undefined>, placeholder :string) {
  return (<input id={id} value={prop.editValue.get()} placeholder={placeholder}
                         onChange={ev => prop.editValue.set(ev.currentTarget.value)}/>)
}

function renderDetails (store :UnitStore) {
  if (store.mode === Mode.EDIT_DETAILS) {
    const unit = store.unit
    return <div className="editMode">
      <h1>If you want to:
        {editString("goal", unit.goal, "Learn about...")}
      </h1>
      <div>
        {editString("benefits", unit.benefits, "Which is great, because...")}
      </div>
      <p>
        <button onClick={() => store.saveDetails()}>Save</button>
        <button onClick={() => store.setMode(Mode.VIEW)}>Cancel</button>
      </p>
    </div>
  } else {
    const {goal, benefits} = store.unit
    return <div>
      <h1>If you want to {goal.value}</h1>
      <button className="editBtn" onClick={() => store.editDetails()}>Edit</button>
      <p>{benefits.value}</p>
      {store.mode === Mode.EDIT_CRITERIA ?
       <div>TODO: edit criteria</div> :
       <div>TODO: format criteria</div>}
    </div>
  }
}

@observer
export class UnitView extends React.Component<{store :UnitStore}> {

  render () {
    const store = this.props.store
    if (store.unit) return (
      <div>
        {renderDetails(store)}
        <p>You should...</p>
        <p>TODO: activites...</p>
      </div>
//        {store.unit.activities.map(renderActivity)}
    )
    else return <div>Loading...</div>
  }
}
