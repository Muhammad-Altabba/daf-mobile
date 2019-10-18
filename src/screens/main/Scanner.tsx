/**
 * Serto Mobile App
 *
 */
import React, { useState } from 'react'
import { Container, FabButton, Screen } from '@kancha/kancha-ui'
import { RNCamera } from 'react-native-camera'
import { NavigationStackScreenProps } from 'react-navigation-stack'
import { Colors, Icons } from '../../theme'

export default (props: NavigationStackScreenProps) => {
  const onBarCodeRead = (e: any) => {
    props.navigation.navigate('App')
    const loadRequest = props.navigation.getParam('loadRequest', null)
    if (loadRequest) {
      loadRequest({
        type: 'DISCLOSURE',
        data: e.data,
      })
    }
  }

  return (
    <Screen
      fabButton={
        <Container alignItems={'center'} justifyContent={'flex-end'}>
          <FabButton
            testID={'CANCEL_SCAN_BTN'}
            color={Colors.CHARCOAL}
            onPress={() => props.navigation.navigate('App')}
            icon={Icons.CLOSE}
          />
        </Container>
      }
    >
      <Container flex={1} backgroundColor={Colors.BLACK}>
        <RNCamera
          captureAudio={false}
          style={{ flex: 1 }}
          onBarCodeRead={onBarCodeRead}
        />
      </Container>
    </Screen>
  )
}
