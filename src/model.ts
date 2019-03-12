import { IObservableValue, observable, computed, toJS } from "mobx"
import * as firebase from "firebase/app"
import "firebase/firestore"

export type Thunk = () => void
export type ID = string
export type URL = string

// -------------------------------------------------------------------------------------------
// Plumbing to expose Firestore documents as collections of reactive properties on the client.
// -------------------------------------------------------------------------------------------

type Ref = firebase.firestore.DocumentReference
type Data = firebase.firestore.DocumentData
const DeleteValue = firebase.firestore.FieldValue.delete()

function assertDefined<T> (value :T|undefined) :T {
  if (value) return value
  throw new Error(`Illegal undefined value`)
}

function updateRef (ref :Ref, data :Data) {
  ref.update(data).
    then(() => console.log(`Yay, updated ${ref.id} (with ${JSON.stringify(data)})`)).
    catch(err => console.warn(`Failed to update ${ref.id}: ${err}`))
}

function isEmptyArray (value :any) :boolean {
  return Array.isArray(value) && value.length === 0
}

/**
 * Reactive property: a part of a data model that can be individually edited, observed for changes,
 * and ultimately synced to a backing database.
 */
abstract class Prop<T> {
  /** The current value of the property. */
  get value () :T { return this.syncValue.get() }

  /** A MobX observable that reflects the value of this property in the backing database. If you
    * chaneg this property, the change will be written to the database. If another client changes
    * this property, the change will be reported via this observable value. */
  abstract get syncValue () :IObservableValue<T>

  /** The key used to index into the database record that stores this property. Whe the property
    * changes we send an update to the database roughly of the form: `name = value`. */
  abstract get name () :string
  /** Reads the current value of this property from a database record. */
  abstract read (data :Data) :void

  /** Prepares to edit this property: copies the current database value into a temporary "edit
    * value" which can be used to display an editing interface to the user. */
  abstract startEdit () :void
  /** Commits an edit to this property: copies the edit value back to the sync value. Note that to
    * "cancel" an edit you simply never call commit. No other action is needed. */
  abstract commitEdit () :void

  toString () { return this.name }
}

function readProp (data :Data, prop :string) :any {
  const dotidx = prop.indexOf(".")
  if (dotidx == -1) return data[prop]
  else return readProp(data[prop.substring(0, dotidx)], prop.substring(dotidx+1))
}

function writeProp (data :Data, prop :string, value :any) {
  if (!data) console.warn(`Cannot write prop to null data [data=${data}] '${prop}'='${value}'`)
  else {
    const dotidx = prop.indexOf(".")
    if (dotidx == -1) data[prop] = value
    else writeProp(data[prop.substring(0, dotidx)], prop.substring(dotidx+1), value)
  }
}

/** The main `Prop` implementation: the edit value is simply a copy of the sync value with no
  * transformations applied. */
export class SimpleProp<T> extends Prop<T> {
  syncValue :IObservableValue<T>
  editValue :IObservableValue<T>

  constructor (readonly name :string, defval :T) {
    super()
    this.syncValue = observable.box(defval)
    this.editValue = observable.box(defval)
  }

  read (data :Data) {
    this.syncValue.set(readProp(data, this.name))
  }
  startEdit () {
    this.editValue.set(this.value)
  }
  commitEdit () {
    this.syncValue.set(this.editValue.get())
  }
}

// function splitTags (text :string) :string[] {
//   return text.split(" ").map(tag => tag.trim()).filter(tag => tag.length > 0)
// }

// /** A property customized for storing tags (lists of words with no spaces in them). */
// class TagsProp extends Prop<string[]> {
//   syncValue :IObservableValue<string[]> = observable.box([])
//   editValue :IObservableValue<string> = observable.box("")

//   constructor (readonly name :string = "tags") { super() }

//   read (data :Data) {
//     this.syncValue.set(readProp(data, this.name) || [])
//   }
//   startEdit () {
//     this.editValue.set(this.value.join(" "))
//   }
//   commitEdit () {
//     const tags = this.editValue.get()
//     const newValue = tags ? splitTags(tags) : []
//     // annoyingly setting a []-valued prop to [] triggers a reaction... ugh JavaScript
//     if (!isEmptyArray(newValue) || !isEmptyArray(this.value)) this.syncValue.set(newValue)
//   }
// }

type Filter = (text :string|void) => boolean
export function makeFilter (seek :string) :Filter {
  if (seek === "") return _ => true
  else if (seek.toLowerCase() !== seek) return text => text ? text.includes(seek) : false
  else return text => text ? (text.toLowerCase().includes(seek)) : false
}

/** Exposes a Firestore document as a collection of reactive properties. Changes to the values of
  * the properties are synced back to the source document (in a fine-grained manner) and external
  * changes are propagated to the reactive properties exposed by `Doc`. */
abstract class Doc {
  protected readonly props :Prop<any>[] = []
  protected _syncing = true

  readonly id :string

  constructor (readonly ref :Ref, readonly data :Data) {
    this.id = ref.id
  }

  read (data :Data) {
    this._syncing = false
    this.readProps(data)
    this._syncing = true
  }

  newProp<T> (name :string, defval :T) {
    return this.addProp(new SimpleProp(name, defval))
  }

  addProp<T,P extends Prop<T>> (prop :P) :P {
    prop.syncValue.observe(change => {
      if (this._syncing) {
        const newValue = toJS(change.newValue)
        console.log(`Syncing ${prop.name} = '${newValue}'`)
        const upValue = (newValue === undefined || isEmptyArray(newValue)) ? DeleteValue : newValue
        updateRef(this.ref, {[prop.name]: upValue})
        writeProp(this.data, prop.name, newValue)
      }
    })
    this.props.push(prop)
    return prop
  }

  removeProp<T> (prop :Prop<T>) {
    const idx = this.props.indexOf(prop)
    if (idx >= 0) this.props.splice(idx, 1)
  }

  startEdit () {
    for (let prop of this.props) prop.startEdit()
  }
  commitEdit () {
    for (let prop of this.props) prop.commitEdit()
  }

  protected readProps (data :Data) {
    for (let prop of this.props) try { prop.read(data) } catch (error) {
      console.warn(`Failed to read prop: ${prop} from ${JSON.stringify(data)}`)
    }
  }
}

interface ListElem {
  deleted () :void
}

function makeList<O, T extends ListElem> (
  data :Data, elemsKey :string, orderKey :string, elems :Map<string, T>,
  owner :O, mkElem :(owner :O, key :string, data :Data) => T
) :string[] {
  const elemsData = data[elemsKey]
  const elemKeys = new Set(Object.keys(elemsData))
  for (let key of elemKeys) {
    let edata = elemsData[key]
    let elem = elems.get(key)
    if (!elem) elems.set(key, mkElem(owner, key, edata))
  }

  // prune removed resources and sanitize the order array
  let order = ((data[orderKey] || []) as string[]).filter(key => elems.has(key))
  const okeys = new Set(order)
  for (let key of Array.from(elems.keys())) {
    if (!elemKeys.has(key)) {
      const oelem = elems.get(key)
      oelem && oelem.deleted()
      elems.delete(key)
    }
    else if (!okeys.has(key)) order.push(key)
  }
  return order
}

// ---------------------
// Curriculum data model
// ---------------------

export type CritType = "age" | "interest" | "custom"

function critKey (key :string) { return `crits.${key}` }

export class Criterion implements ListElem {
  readonly type :SimpleProp<CritType>
  readonly min :SimpleProp<number|undefined>
  readonly max :SimpleProp<number|undefined>
  readonly text :SimpleProp<string|undefined>

  constructor (readonly owner :Unit, readonly key :string) {
    const pre = critKey(key)
    this.type = owner.newProp<CritType>(`${pre}.type`, "custom")
    this.min = owner.newProp(`${pre}.min`, undefined)
    this.max = owner.newProp(`${pre}.max`, undefined)
    this.text = owner.newProp(`${pre}.text`, undefined)
  }

  deleted () {
    this.owner.removeProp(this.type)
    this.owner.removeProp(this.min)
    this.owner.removeProp(this.max)
    this.owner.removeProp(this.text)
  }

  toData () :Data {
    const data :Data = {type: this.type.value}
    if (this.min.value) data.min = this.min.value
    if (this.max.value) data.max = this.max.value
    if (this.text.value) data.text = this.text.value
    return data
  }
}

export type ResourceType = "page" | "video" | "movie" | "book" /* | ... */

function rsrcKey (key :string) { return `rsrcs.${key}` }

export class Resource implements ListElem {
  readonly type :SimpleProp<ResourceType>
  readonly url :SimpleProp<URL|void>
  readonly previewUrl :SimpleProp<URL|void>
  readonly title :SimpleProp<string|undefined>
  readonly description :SimpleProp<string|undefined>

  constructor (readonly owner :Activity, readonly key :string) {
    const pre = rsrcKey(key)
    this.type = owner.newProp<ResourceType>(`${pre}.type`, "page")
    this.url = owner.newProp(`${pre}.url`, undefined)
    this.previewUrl = owner.newProp(`${pre}.previewUrl`, undefined)
    this.title = owner.newProp(`${pre}.title`, undefined)
    this.description = owner.newProp(`${pre}.description`, undefined)
  }

  deleted () {
    this.owner.removeProp(this.type)
    this.owner.removeProp(this.url)
    this.owner.removeProp(this.previewUrl)
    this.owner.removeProp(this.title)
    this.owner.removeProp(this.description)
  }

  toData () :Data {
    const data :Data = {type: this.type.value}
    if (this.url.value) data.url = this.url.value
    if (this.previewUrl.value) data.previewUrl = this.previewUrl.value
    if (this.title.value) data.title = this.title.value
    if (this.description.value) data.description = this.description.value
    return data
  }
}

export class Location {
  readonly name :SimpleProp<string>
  readonly lat :SimpleProp<string|undefined>
  readonly lon :SimpleProp<string|undefined>

  constructor (readonly owner :Activity) {
    this.name = owner.newProp(`loc.name`, "")
    this.lat = owner.newProp(`loc.lat`, undefined)
    this.lon = owner.newProp(`loc.lon`, undefined)
  }
}

export type ActivityType = "watch" | "read" | "consider" | "draw" | "write" /* | ... */ | "custom"

export class Activity extends Doc {
  private _unsubscribe = () => {}

  readonly created :firebase.firestore.Timestamp
  readonly type = this.newProp<ActivityType>("type", "read")
  readonly title = this.newProp<string|undefined>("title", undefined)
  readonly intro = this.newProp<string|undefined>("intro", undefined)
  readonly location :Location

  @observable rsrcOrder :string[] = []
  readonly rsrcMap :Map<string,Resource> = new Map()
  @computed get resources () :Resource[] {
    return this.rsrcOrder.map(key => assertDefined(this.rsrcMap.get(key)))
  }

  constructor (ref :Ref, data :Data, live :boolean = false) {
    super(ref, data)
    this.created = data.created
    this.location = new Location(this)

    if (live) {
      console.log(`Subscribing to doc: ${this.ref.id}`)
      this._unsubscribe = this.ref.onSnapshot(doc => {
        // console.log(`Doc updated: ${this.ref.id}`) // : ${JSON.stringify(doc.data())}`)
        this.read(doc.data() || {})
      })
    } else this.read(data)
  }

  // TODO: who calls close?
  close () {
    this._unsubscribe()
  }

  protected readProps (data :Data) {
    // add and update resources
    const rsrcOrder = makeList(data, `rsrcs`, `rsrcOrder`, this.rsrcMap, this,
                               (owner, key, _) => new Resource(owner, key))
    // read our props, including those for the resources
    super.readProps(data)
    // finally update order which will trigger a rebuild of our resources view
    this.rsrcOrder = rsrcOrder
  }

  // TODO: can we abstract more of this plumbing for "sub-lists"
  addResource (type :ResourceType) :string {
    // if two people add a resource at exactly the same time, they'll both end up editing the same
    // resource; but they'll see it happening as the edits are propagated in real time to both
    // clients, so they can have a little laugh and tell the story to their grandchildren
    let key = String(this.rsrcOrder.map(parseInt).reduce((a, b) => Math.max(a, b), 0) + 1)
    let edata = {type}
    this.rsrcMap.set(key, new Resource(this, key))
    this.rsrcOrder.push(key)
    updateRef(this.ref, {[rsrcKey(key)]: edata, "rsrcOrder": toJS(this.rsrcOrder)})
    return key
  }

  deleteResource (key :string) :Thunk {
    const changes :Data = {}
    const undo :Data = {}
    const rsrc = this.rsrcMap.get(key)
    if (rsrc && this.rsrcMap.delete(key)) {
      changes[rsrcKey(key)] = DeleteValue
      undo[rsrcKey(key)] = rsrc.toData()
      rsrc.deleted()
    }
    const oidx = this.rsrcOrder.indexOf(key)
    if (oidx >= 0) {
      undo["rsrcOrder"] = toJS(this.rsrcOrder)
      this.rsrcOrder.splice(oidx, 1)
      changes["rsrcOrder"] = this.rsrcOrder
    }
    updateRef(this.ref, changes)
    console.dir(undo)
    return () => updateRef(this.ref, undo)
  }

  moveResource (key :string, delta :number) {
    let opos = this.rsrcOrder.indexOf(key)
    if (opos >= 0) {
      let npos = Math.min(Math.max(opos+delta, 0), this.rsrcOrder.length-1)
      if (opos !== npos) {
        let norder = toJS(this.rsrcOrder)
        norder.splice(opos, 1)
        norder.splice(npos, 0, key)
        this.rsrcOrder = norder
        updateRef(this.ref, {"rsrcOrder": norder})
      }
    }
  }
}

export type UnitSummary = {
  id :string,
  goal :string
}

export class Unit extends Doc {
  private _unsubscribe = () => {}

  readonly created :firebase.firestore.Timestamp
  readonly goal = this.newProp<string|undefined>("goal", undefined)
  readonly benefits = this.newProp<string|undefined>("benefits", undefined)
  readonly justification = this.newProp<string|undefined>("justification", undefined)

  @observable critOrder :string[] = []
  readonly critMap :Map<string,Criterion> = new Map()
  @computed get criteria () :Criterion[] {
    return this.critOrder.map(key => assertDefined(this.critMap.get(key)))
  }

  // TODO: activities as a sub-collection

  constructor (ref :Ref, data :Data, live :boolean = false) {
    super(ref, data)
    this.created = data.created

    if (live) {
      console.log(`Subscribing to doc: ${this.ref.id}`)
      this._unsubscribe = this.ref.onSnapshot(doc => {
        // console.log(`Doc updated: ${this.ref.id}`) // : ${JSON.stringify(doc.data())}`)
        this.read(doc.data() || {})
      })
    } else this.read(data)
  }

  // TODO: who calls close?
  close () {
    this._unsubscribe()
  }

  protected readProps (data :Data) {
    // add and update criteria
    const critOrder = makeList(data, `crits`, `critOrder`, this.critMap, this,
                               (owner, key, _) => new Criterion(owner, key))
    // read our props, including those for the criteria
    super.readProps(data)
    // finally update order which will trigger a rebuild of our criteria view
    this.critOrder = critOrder
  }

  // TODO: can we abstract more of this plumbing for "sub-lists"
  addCriterion (type :CritType) :string {
    // if two people add a criterion at exactly the same time, they'll both end up editing the same
    // criterion; but they'll see it happening as the edits are propagated in real time to both
    // clients, so they can have a little laugh and tell the story to their grandchildren
    let key = String(this.critOrder.map(parseInt).reduce((a, b) => Math.max(a, b), 0) + 1)
    let edata = {type}
    this.critMap.set(key, new Criterion(this, key))
    this.critOrder.push(key)
    updateRef(this.ref, {[critKey(key)]: edata, "critOrder": toJS(this.critOrder)})
    return key
  }

  deleteCriterion (key :string) :Thunk {
    const changes :Data = {}
    const undo :Data = {}
    const crit = this.critMap.get(key)
    if (crit && this.critMap.delete(key)) {
      changes[critKey(key)] = DeleteValue
      undo[critKey(key)] = crit.toData()
      crit.deleted()
    }
    const oidx = this.critOrder.indexOf(key)
    if (oidx >= 0) {
      undo["critOrder"] = toJS(this.critOrder)
      this.critOrder.splice(oidx, 1)
      changes["critOrder"] = this.critOrder
    }
    updateRef(this.ref, changes)
    console.dir(undo)
    return () => updateRef(this.ref, undo)
  }

  moveCriterion (key :string, delta :number) {
    let opos = this.critOrder.indexOf(key)
    if (opos >= 0) {
      let npos = Math.min(Math.max(opos+delta, 0), this.critOrder.length-1)
      if (opos !== npos) {
        let norder = toJS(this.critOrder)
        norder.splice(opos, 1)
        norder.splice(npos, 0, key)
        this.critOrder = norder
        updateRef(this.ref, {"critOrder": norder})
      }
    }
  }
}
