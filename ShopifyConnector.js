const request = require("request-promise-native");
const {BadRequestError} = require("restify-errors");

class ShopifyConnector {
  constructor(clientId, clientSecret, shopId, loggedInRedirect, loggedOutRedirect, logger) {
    this.clientId = clientId
    this.shopId = shopId
    this.loggedInRedirect = loggedInRedirect
    this.loggedOutRedirect = loggedOutRedirect
    this.logger = logger

    this.basicAuthCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    this.shopifyBaseUrl = `https://shopify.com/${this.shopId}`
    this.scopes = 'https://api.customers.com/auth/customer.graphql'
  }

  getAuthorizationRedirectUrl (state, nonce) {
    const url = `${this.shopifyBaseUrl}/auth/oauth/authorize`
    const params = [
      `scope=${this.scopes}`,
      `client_id=${this.clientId}`,
      'response_type=code',
      `redirect_uri=${this.loggedInRedirect}`,
      `state=${state}`,
      `nonce=${nonce}`
    ]

    this.logger.info({ url, params }, 'Redirecting to Shopify authorization . . .')

    return `${url}?${params.join('&')}`
  }

  async fetchAccessToken (authCode, state) {
    return request({
      method: 'post',
      url: `${this.shopifyBaseUrl}/auth/oauth/token`,
      headers: { Authorization: `Basic ${this.basicAuthCredentials}` },
      form: {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        code: authCode,
        redirect_uri: `${this.loggedInRedirect}`
      },
      json: true
    })
  }

  async fetchExchangeToken (accessToken) {
    return request({
      method: 'post',
      url: `${this.shopifyBaseUrl}/auth/oauth/token`,
      headers: { Authorization: `Basic ${this.basicAuthCredentials}` },
      form: {
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        client_id: this.clientId,
        audience: '30243aa5-17c1-465a-8493-944bcc4e88aa',
        subject_token: accessToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        scopes: this.scopes
      },
      json: true
    })
  }

  async fetchCustomerData (xAccessToken) {
    return request({
      method: 'post',
      url: `${this.shopifyBaseUrl}/account/customer/api/2024-07/graphql`,
      headers: { Authorization: `${xAccessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: { query: '{ customer { emailAddress { emailAddress } } }', variables: {} },
      json: true
    })
  }

  verifyAuthCode (query, state) {
    const authCode = query?.code
    const authState = query?.state

    if (!authCode) throw new BadRequestError('authCode required in query')
    if (!authState) throw new BadRequestError('state required in query')

    if (authState !== state) {
      this.logger.error({ authState, state }, 'State mismatch')
      throw new BadRequestError('state does not match expected value')
    }

    return authCode
  }

  verifyAccessToken (accessToken, state, nonce) {
    const jwt = this.decodeJwt(accessToken.id_token)

    if (!jwt?.payload?.nonce) {
      this.logger.error({ nonce, jwt }, 'nonce mismatch')
      throw new BadRequestError('nonce mismatch')
    }
  }

  decodeJwt (idToken) {
    const [header, payload, signature] = idToken.split('.')

    const decodedHeader = JSON.parse(atob(header))
    const decodedPayload = JSON.parse(atob(payload))

    return {
      header: decodedHeader,
      payload: decodedPayload,
      signature,
    }
  }
}

module.exports = ShopifyConnector