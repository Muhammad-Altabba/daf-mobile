import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
// import { resolver as naclDidResolver } from 'nacl-did'
import { getResolver as webDidResolver } from 'web-did-resolver'

import * as Daf from 'daf-core'
import * as DidJwt from 'daf-did-jwt'
import EthrDidRnController from 'daf-ethr-did-react-native'

import * as W3c from 'daf-w3c'
import * as SD from 'daf-selective-disclosure'
import * as TG from 'daf-trust-graph'
import * as DBG from 'daf-debug'
import * as URL from 'daf-url'

import RnSqlite from 'daf-react-native-sqlite3'
import { DataStore, Gql as DataGql } from 'daf-data-store'

import merge from 'lodash.merge'

import Config from 'react-native-config'

import Debug from 'debug'
Debug.enable('*')
const debug = Debug('main')

import * as LocalGql from './graphql'

if (Config.TGE_URI) TG.ServiceController.defaultUri = Config.TGE_URI
if (Config.TGE_WS_URI) TG.ServiceController.defaultWsUri = Config.TGE_WS_URI

export const typeDefs = [
  Daf.Gql.baseTypeDefs,
  Daf.Gql.Core.typeDefs,
  Daf.Gql.IdentityManager.typeDefs,
  DataGql.typeDefs,
  // DIDComm.Gql.typeDefs,
  TG.Gql.typeDefs,
  W3c.Gql.typeDefs,
  SD.Gql.typeDefs,
  LocalGql.typeDefs,
]

export const resolvers = merge(
  Daf.Gql.Core.resolvers,
  DataGql.resolvers,
  // DIDComm.Gql.resolvers,
  TG.Gql.resolvers,
  Daf.Gql.IdentityManager.resolvers,
  W3c.Gql.resolvers,
  SD.Gql.resolvers,
  LocalGql.resolvers,
)

// DID Document Resolver
const web = webDidResolver()
const didResolver = new Resolver({
  ...ethrDidResolver({
    rpcUrl: 'https://mainnet.infura.io/v3/5ffc47f65c4042ce847ef66a3fa70d4c',
  }),
  ...web,
  https: web.web,
  // nacl: naclDidResolver
})

const identityControllers = [new EthrDidRnController()]

const messageValidator = new DBG.MessageValidator()
messageValidator
  .setNext(new URL.MessageValidator())
  .setNext(new DidJwt.MessageValidator())
  .setNext(new W3c.MessageValidator())
  .setNext(new SD.MessageValidator())

const actionHandler = new DBG.ActionHandler()
actionHandler
  // .setNext(new DIDComm.ActionHandler())
  .setNext(new TG.ActionHandler())
  .setNext(new W3c.ActionHandler())
  .setNext(new SD.ActionHandler())

const serviceControllers = [TG.ServiceController]

export const core = new Daf.Core({
  identityControllers,
  serviceControllers,
  didResolver,
  messageValidator,
  actionHandler,
})

export const db = new RnSqlite('database.sqlite3')
export const dataStore = new DataStore(db)
