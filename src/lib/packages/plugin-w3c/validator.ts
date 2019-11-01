import { DidJwtPayloadValidator } from '../plugin-did-jwt-validator'
import { PreValidatedMessage } from '../core/types'
import { Resolver } from 'did-resolver'
import {
  verifyCredential,
  validateVerifiableCredentialAttributes,
  validatePresentationAttributes,
} from 'did-jwt-vc'

import Debug from 'debug'
const debug = Debug('w3c-validator')

export const MessageTypes = {
  vc: 'w3c.vc',
  vp: 'w3c.vp',
}

class W3cJwtPayloadValidator implements DidJwtPayloadValidator {
  async validate(
    verifiedJwt: any,
    didResolver: Resolver,
  ): Promise<PreValidatedMessage> {
    try {
      validatePresentationAttributes(verifiedJwt.payload)

      debug('JWT is', MessageTypes.vp)

      const vc = await Promise.all(
        verifiedJwt.payload.vp.verifiableCredential.map((vcJwt: string) =>
          verifyCredential(vcJwt, didResolver),
        ),
      )

      return {
        type: MessageTypes.vp,
        raw: verifiedJwt.jwt,
        issuer: verifiedJwt.payload.iss,
        subject: verifiedJwt.payload.sub,
        time: verifiedJwt.payload.nbf || verifiedJwt.payload.iat,
        verified: verifiedJwt,
        custom: {
          vc,
        },
      }
    } catch (e) {}

    try {
      validateVerifiableCredentialAttributes(verifiedJwt.payload)
      debug('JWT is', MessageTypes.vc)
      return {
        type: MessageTypes.vc,
        raw: verifiedJwt.jwt,
        issuer: verifiedJwt.payload.iss,
        subject: verifiedJwt.payload.sub,
        time: verifiedJwt.payload.nbf || verifiedJwt.payload.iat,
        verified: verifiedJwt,
        custom: {
          vc: [verifiedJwt],
        },
      }
    } catch (e) {}

    return Promise.reject()
  }
}

export default W3cJwtPayloadValidator
