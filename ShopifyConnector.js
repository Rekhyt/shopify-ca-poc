const request = require('request-promise-native')
const { BadRequestError } = require('restify-errors')

const USER_AGENT = 'Shopify CA PoC/alpha'

class ShopifyConnector {

  constructor(storefrontAccessToken, clientId, clientSecret, shopUrl, shopId, loggedInRedirect, loggedOutRedirect, logger) {
    this.storefrontAccessToken = storefrontAccessToken
    this.clientId = clientId
    this.shopUrl = shopUrl
    this.shopId = shopId
    this.loggedInRedirect = loggedInRedirect
    this.loggedOutRedirect = loggedOutRedirect
    this.logger = logger

    this.basicAuthCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    this.shopifyBaseUrl = `https://shopify.com/${this.shopId}`
    this.storefrontApiUrl = `${shopUrl}/api/2023-10/graphql`
    this.scopes = 'https://api.customers.com/auth/customer.graphql'
  }

  getAuthorizationRedirectUrl (state, nonce) {
    const url = new URL(`${this.shopifyBaseUrl}/auth/oauth/authorize`)
    url.searchParams.append('scope', `openid email ${this.scopes}`)
    url.searchParams.append('client_id', this.clientId)
    url.searchParams.append('response_type', 'code')
    url.searchParams.append('redirect_uri', this.loggedInRedirect)
    url.searchParams.append('state', state)
    url.searchParams.append('nonce', nonce)

    this.logger.info({ url }, 'Redirecting to Shopify authorization . . .')

    return url.toString()
  }

  async fetchAccessToken (authCode) {
    return request({
      method: 'POST',
      url: `${this.shopifyBaseUrl}/auth/oauth/token`,
      headers: { Authorization: `Basic ${this.basicAuthCredentials}`, 'User-Agent': USER_AGENT },
      form: {
        grant_type: 'authorization_code',
        redirect_uri: this.loggedInRedirect,
        code: authCode
      },
      json: true
    })
  }

  async fetchExchangeToken (accessToken) {
    return request({
      method: 'post',
      url: `${this.shopifyBaseUrl}/auth/oauth/token`,
      headers: { Authorization: `Basic ${this.basicAuthCredentials}`, 'User-Agent': USER_AGENT },
      form: {
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        audience: '30243aa5-17c1-465a-8493-944bcc4e88aa',
        subject_token: accessToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        scopes: this.scopes
      },
      json: true
    })
  }

  async fetchStorefrontAccessToken (xAccessToken) {
    return request({
      method: 'post',
      url: `${this.shopifyBaseUrl}/account/customer/api/2024-07/graphql`,
      headers: { Authorization: xAccessToken, 'User-Agent': USER_AGENT },
      body: {
        query: 'mutation storefrontCustomerAccessTokenCreate { storefrontCustomerAccessTokenCreate { customerAccessToken userErrors { field message } } }',
        variables: {}
      },
      json: true
    })
  }

  async fetchCustomerData (xAccessToken) {
    return request({
      method: 'post',
      url: `${this.shopifyBaseUrl}/account/customer/api/2024-07/graphql`,
      headers: { Authorization: `${xAccessToken}`, 'User-Agent': USER_AGENT, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: { query: '{ customer { firstName lastName emailAddress { emailAddress } } }', variables: {} },
      json: true
    })
  }

  async createCart (customerAccessToken) {
    return request({
      method: 'post',
      uri: this.storefrontApiUrl,
      headers: { 'x-shopify-storefront-access-token': this.storefrontAccessToken },
      body: {
        query: `mutation { cartCreate(input: { buyerIdentity: { customerAccessToken: "${customerAccessToken}" } }) { cart { id } } }`,
        variables: {}
      },
      json: true
    })
  }

  async fetchCart (id) {
    return request({
      method: 'post',
      uri: this.storefrontApiUrl,
      headers: { 'x-shopify-storefront-access-token': this.storefrontAccessToken, 'User-Agent': USER_AGENT },
      body: {
        query: 'query cart($id: ID!) { cart (id: $id) { buyerIdentity { customer { id firstName lastName email } } checkoutUrl } }',
        variables: { id }
      },
      json: true
    })
  }

  async addProductToCart (id, lines) {
    return request({
      method: 'post',
      uri: this.storefrontApiUrl,
      headers: { 'x-shopify-storefront-access-token': this.storefrontAccessToken, 'User-Agent': USER_AGENT },
      body: {
        query: 'mutation cartLinesAdd($id: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $id, lines: $lines) { cart { checkoutUrl } } }',
        variables: { id, lines }
      },
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
