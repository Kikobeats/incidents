'use strict'

const KeyvFirestore = require('keyv-firestore')
const Keyv = require('keyv')

const {
  FIRESTORE_PROJECT_ID,
  FIRESTORE_PRIVATE_KEY,
  FIRESTORE_CLIENT_EMAIL
} = require('./constants')

const createFirebase = collection =>
  new KeyvFirestore({
    projectId: FIRESTORE_PROJECT_ID,
    collection,
    credentials: {
      private_key: Buffer.from(FIRESTORE_PRIVATE_KEY, 'base64').toString(),
      client_email: FIRESTORE_CLIENT_EMAIL
    }
  })

const COLLECTION_NAME = 'incidents'

const createDb = collection => {
  const firebase = createFirebase(collection)
  const keyv = new Keyv({ store: firebase })
  return keyv
}

module.exports = createDb(COLLECTION_NAME)
