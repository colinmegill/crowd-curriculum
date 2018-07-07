import * as H from './hello'

it('computed properties work as advertized', () => {
  const store = new H.HelloStore()
  expect(store.who).toEqual("World")
  expect(store.message).toEqual("Hello World!")
  store.who = "Dolly"
  expect(store.message).toEqual("Hello Dolly!")
})
