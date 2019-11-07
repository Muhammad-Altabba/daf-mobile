import PubSub from 'pubsub-js'
import { Resolver } from 'did-resolver'
import { IdentityManager, IdentityController } from './identity-manager'
import { ServiceManager, ServiceControllerWithConfig } from './service-manager'
import { MessageValidator } from './message-validator'
import { ActionHandler } from './action-handler'
import {
  ValidatedMessage,
  PreValidatedMessage,
  RawMessage,
  Action,
} from './types'
import { EncryptionKeyManager } from './encryption-manager'
const blake = require('blakejs')

import Debug from 'debug'
const debug = Debug('core')

export const EventTypes = {
  validatedMessage: 'validatedMessage',
  error: 'error',
}

interface Config {
  didResolver: Resolver
  identityControllers: IdentityController[]
  serviceControllersWithConfig: ServiceControllerWithConfig[]
  messageValidator: MessageValidator
  actionHandler?: ActionHandler
  encryptionKeyManager?: EncryptionKeyManager
}

export class Core {
  public identityManager: IdentityManager
  public encryptionKeyManager?: EncryptionKeyManager
  public didResolver: Resolver
  private serviceManager: ServiceManager
  private messageValidator: MessageValidator
  private actionHandler?: ActionHandler

  constructor(config: Config) {
    this.identityManager = new IdentityManager({
      identityControllers: config.identityControllers,
    })

    this.encryptionKeyManager = config.encryptionKeyManager

    this.didResolver = config.didResolver

    this.serviceManager = new ServiceManager({
      serviceControllersWithConfig: config.serviceControllersWithConfig,
      onRawMessage: this.onRawMessage.bind(this),
      didResolver: this.didResolver,
    })

    this.messageValidator = config.messageValidator

    this.actionHandler = config.actionHandler
  }

  async startServices() {
    const issuers = await this.identityManager.listIssuers()
    await this.serviceManager.configureServices(issuers)
    await this.serviceManager.initServices()
  }

  async syncServices(since: number) {
    await this.serviceManager.syncServices(since)
  }

  public async onRawMessage(rawMessage: RawMessage) {
    debug('Raw message %O', rawMessage)
    try {
      const preValidatedMessage = await this.messageValidator.validate(
        rawMessage,
        this,
      )
      if (
        preValidatedMessage !== null &&
        this.isValidatedMessage(preValidatedMessage)
      ) {
        const validatedMessage = {
          ...preValidatedMessage,
          hash: blake.blake2bHex(preValidatedMessage.raw),
        }
        this.onValidatedMessage(validatedMessage)
      }
    } catch (error) {
      this.onMessageValidationError(error, rawMessage)
    }
  }

  private isValidatedMessage(message: PreValidatedMessage): boolean {
    if (message === null) {
      return false
    }
    if (!message.type || message.type == '') {
      debug('Missing `type` in %o', message)
      return false
    }
    if (!message.issuer || message.issuer == '') {
      debug('Missing `issuer` in %o', message)
      return false
    }
    if (!message.raw || message.raw == '') {
      debug('Missing `raw` in %o', message)
      return false
    }
    return true
  }

  private onMessageValidationError(error: string, rawMessage: RawMessage) {
    PubSub.publish(EventTypes.error, { error, rawMessage })
  }

  private onValidatedMessage(message: ValidatedMessage) {
    PubSub.publish(EventTypes.validatedMessage + '.' + message.type, message)
  }

  public on(type: String, callback: (type: string, data: any) => void) {
    return PubSub.subscribe(type, callback)
  }

  public async handleAction(action: Action): Promise<any> {
    if (this.actionHandler) {
      return this.actionHandler.handleAction(action, this)
    } else {
      return Promise.reject('No action handler')
    }
  }
}
