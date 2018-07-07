import * as React from 'react'
import { observable, computed } from 'mobx'
import { observer } from 'mobx-react'

export class HelloStore {
  @observable who = "World"

  @computed get message () :string {
    return `Hello ${this.who}!`
  }
}

@observer
export class Hello extends React.Component<{store :HelloStore}> {

  render () {
    return (<div>{this.props.store.message}</div>)
  }
}
