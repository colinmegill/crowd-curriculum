import * as firebase from "firebase/app"
import "firebase/firestore"
import * as M from "./model"

type ColRef = firebase.firestore.CollectionReference
// type Data = firebase.firestore.DocumentData
// type Query = firebase.firestore.Query
// type Ref = firebase.firestore.DocumentReference
// const Timestamp = firebase.firestore.Timestamp

export class DB {
  db = firebase.firestore()
  uid :string = "none"

  constructor () {
    this.db.settings({})
    this.db.enablePersistence().catch(error => {
      console.warn(`Failed to enable offline mode: ${error}`)
    })
  }

  setUserId (uid :string) {
    this.uid = uid
  }

  userCollection (name :string) :ColRef {
    return this.db.collection("users").doc(this.uid).collection(name)
  }

  async units () :Promise<M.UnitSummary[]> {
    let units = await this.db.collection("units").get()
    return units.docs.map(doc => ({id: doc.ref.id, goal: doc.data().goal}))
  }

  async createUnit () :Promise<M.Unit> {
    let ref = this.db.collection("units").doc()
    let data = {}
    // TODO: set creation timestamp & creator id
    console.log(`Created unit ${ref.path}...`)
    return new M.Unit(ref, data)
  }

  async unit (id :string) :Promise<M.Unit> {
    console.log(`Loading unit ${id}...`)
    let ref = this.db.collection("units").doc(id)
    let doc = await ref.get()
    if (!doc.exists) throw new Error(`Requested unknown unit: ${id}`)
    return new M.Unit(ref, doc.data() || {})
  }
}
