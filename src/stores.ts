import { action, /*computed, */ observable/*, autorun*/ } from "mobx"
import * as firebase from "firebase/app"
import "firebase/auth"
import * as DB from "./db"
import * as M from "./model"

//
// View model for feedback (snack) popups

type Snaction = {message :string, undo :M.Thunk|void}

export class SnackStore {
  @observable showing = false
  @observable current :Snaction = {message: "", undo: undefined}
  readonly queue :Snaction[] = []

  showFeedback (message :string, undo :M.Thunk|void = undefined) {
    this.queue.push({message, undo})
    // if we're currently showing when a message comes in, clear that message immediately;
    // once it's transitioned off screen, we'll show the next message
    if (this.showing) this.showing = false
    else this.showNext()
  }

  showNext () {
    const next = this.queue.shift()
    if (next) {
      this.current = next
      this.showing = true
    }
  }
}

//
// View model for main site/app

export class AppStore {
  readonly db = new DB.DB()
  readonly snacks = new SnackStore()

  @observable hash :string = window.location.hash
  @observable user :firebase.User|null = null

  constructor () {
    firebase.auth().onAuthStateChanged(user => {
      if (user) console.log(`User logged in: ${user.uid}`)
      else console.log('User logged out.')
      this.db.setUserId(user ? user.uid : "none")
      this.user = user
    })

    window.addEventListener(
      'hashchange',
      action('hashchangeHandler', _ => { this.hash = window.location.hash })
    )
  }
}
