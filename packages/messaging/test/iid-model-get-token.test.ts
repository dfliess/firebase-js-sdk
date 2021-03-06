/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { expect } from 'chai';
import * as sinon from 'sinon';
import { IIDModel } from '../src/models/iid-model';
import { ERROR_CODES, ERROR_MAP } from '../src/models/errors';
import { fetchMock } from './testing-utils/mock-fetch';
import { makeFakeSubscription } from './make-fake-subscription';
import { DEFAULT_PUBLIC_VAPID_KEY } from '../src/models/fcm-details';

describe('Firebase Messaging > IIDModel.getToken()', function() {
  const fcmSenderId = '1234567';
  const fcmToken = 'qwerty';
  const fcmPushSet = '7654321';
  const subscription = makeFakeSubscription();
  const appPubKey = new Uint8Array([
    255,
    237,
    107,
    177,
    171,
    78,
    84,
    131,
    221,
    231,
    87,
    188,
    22,
    232,
    71,
    15
  ]).buffer;

  const sandbox = sinon.sandbox.create();
  let stubedFetch;
  let globalIIDModel;

  const cleanUp = () => {
    sandbox.restore();
    globalIIDModel = null;
  };

  beforeEach(function() {
    return cleanUp();
  });

  after(function() {
    return cleanUp();
  });

  it('should getToken on valid request with custom VAPID key', async function() {
    globalIIDModel = new IIDModel();
    const mockResponse = {
      token: fcmToken,
      pushSet: fcmPushSet
    };
    sandbox
      .stub(window, 'fetch')
      .returns(fetchMock.jsonOk(JSON.stringify(mockResponse)));
    await globalIIDModel.getToken(
      fcmSenderId,
      subscription,
      appPubKey,
      fcmPushSet
    );
  });

  it('should getToken on valid request with default VAPID key', async function() {
    globalIIDModel = new IIDModel();
    const mockResponse = {
      token: fcmToken,
      pushSet: fcmPushSet
    };
    sandbox
      .stub(window, 'fetch')
      .returns(fetchMock.jsonOk(JSON.stringify(mockResponse)));
    await globalIIDModel.getToken(
      fcmSenderId,
      subscription,
      DEFAULT_PUBLIC_VAPID_KEY,
      fcmPushSet
    );
  });

  it('should handle fetch errors', async function() {
    globalIIDModel = new IIDModel();
    const errorMsg = 'invalid token';
    sandbox.stub(window, 'fetch').returns(fetchMock.jsonError(400, errorMsg));
    try {
      await globalIIDModel.getToken(
        fcmSenderId,
        subscription,
        appPubKey,
        fcmPushSet
      );
      throw new Error('Expected error to be thrown.');
    } catch (e) {
      expect(e.message).to.equal(errorMsg);
    }
  });

  it('should handle fetch errors, HTML response returned', async function() {
    globalIIDModel = new IIDModel();
    sandbox
      .stub(window, 'fetch')
      .returns(fetchMock.htmlError(400, 'html-response'));
    try {
      await globalIIDModel.getToken(
        fcmSenderId,
        subscription,
        appPubKey,
        fcmPushSet
      );
      throw new Error('Expected error to be thrown.');
    } catch (e) {
      expect(e.code).to.include(ERROR_CODES.TOKEN_SUBSCRIBE_FAILED);
    }
  });

  it('should handle invalid fetch response, no FCM token returned', async function() {
    globalIIDModel = new IIDModel();
    const mockInvalidResponse = {
      pushSet: fcmPushSet
    };
    sandbox
      .stub(window, 'fetch')
      .returns(fetchMock.jsonOk(JSON.stringify(mockInvalidResponse)));
    try {
      await globalIIDModel.getToken(
        fcmSenderId,
        subscription,
        appPubKey,
        fcmPushSet
      );
      throw new Error('Expected error to be thrown.');
    } catch (e) {
      expect(e.message).to.include(
        ERROR_MAP[ERROR_CODES.TOKEN_SUBSCRIBE_NO_TOKEN]
      );
    }
  });

  it('should handle invalid fetch response, no push set token returned', async function() {
    globalIIDModel = new IIDModel();
    const mockInvalidResponse = {
      token: fcmToken
    };
    sandbox
      .stub(window, 'fetch')
      .returns(fetchMock.jsonOk(JSON.stringify(mockInvalidResponse)));
    try {
      await globalIIDModel.getToken(
        fcmSenderId,
        subscription,
        appPubKey,
        fcmPushSet
      );
      throw new Error('Expected error to be thrown.');
    } catch (e) {
      expect(e.code).to.include(ERROR_CODES.TOKEN_SUBSCRIBE_NO_PUSH_SET);
    }
  });
});
