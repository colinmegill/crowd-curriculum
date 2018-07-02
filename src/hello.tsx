import * as React from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

export class HelloStore {
  @observable who = "World"
}

@observer
export class Hello extends React.Component<{store :HelloStore}> {

  render () {
    return (<div>Hello {this.props.store.who}!</div>)
  }
}
