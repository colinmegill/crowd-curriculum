import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import * as U from './unit'

class AppStore {
  @observable hash :string = window.location.hash
}

const appStore = new AppStore()

window.addEventListener(
  'hashchange',
  action('hashchangeHandler', ev => {
    appStore.hash = window.location.hash
  })
)

@observer
class App extends React.Component<{store :AppStore}>  {
  render () {
    const {hash} = this.props.store
    if (hash.startsWith("#unit-")) {
      return <U.UnitView store={new U.UnitStore(hash.substring(6))} />
    } else {
      return <U.UnitList store={new U.UnitListStore()} />
    }
  }
}

ReactDOM.render(
  <App store={appStore} />,
  document.getElementById('root')
)
