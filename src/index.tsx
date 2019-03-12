import { observer } from 'mobx-react'
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as firebase from "firebase/app"

import * as S from './stores'
import * as U from './unit'

firebase.initializeApp({
  apiKey: "AIzaSyBzjjpjg2yCBWEfZgr6Nkw9Ws5eDUYwzSE",
  authDomain: "crowd-curriculum.firebaseapp.com",
  projectId: "crowd-curriculum",
})

const appStore = new S.AppStore()

@observer
class App extends React.Component<{store :S.AppStore}>  {
  render () {
    const {hash, db} = this.props.store
    if (hash.startsWith("#unit-")) {
      return <U.UnitView store={new U.UnitStore(db, hash.substring(6))} />
    } else {
      return <U.UnitList store={new U.UnitListStore(db)} />
    }
  }
}

ReactDOM.render(
  <App store={appStore} />,
  document.getElementById('root')
)
