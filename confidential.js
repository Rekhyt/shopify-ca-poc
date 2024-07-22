require('dotenv').config()
const bunyan = require('bunyan')
const restify = require('restify')
const uuid = require('uuid').v4

const config = require('./config')
const logger = bunyan.createLogger({ name: config.name, serializers: bunyan.stdSerializers })
const server = restify.createServer()

server.use(restify.plugins.bodyParser())
server.use(restify.plugins.queryParser())

const selfBaseUrl = config.url
const ShopifyConnector = require('./ShopifyConnector')
const shopifyConnector = new ShopifyConnector(
  config.storefrontApi.accessToken,
  config.customerAccountApi.confidential.clientId,
  config.customerAccountApi.confidential.clientSecret,
  config.shopUrl,
  config.shopId,
  `${selfBaseUrl}/loggedIn`,
  `${selfBaseUrl}/loggedOut`,
  logger
)

let nonce
let state
let accessToken
let xAccessToken // customer's access token to the customer accounts API
let sAccessToken // customer's access token to the storefront API
let cartId

server.get('/login', async (req, res) => {
  logger.info('GET /login . . .')
  state = uuid()
  nonce = uuid()

  const url = shopifyConnector.getAuthorizationRedirectUrl(state, nonce)

  logger.info({ url }, 'Redirecting to Shopify authorization . . .')
  res.redirect(url, v => v)
})

server.get('/loggedIn', async (req, res) => {
  logger.info({ query: req.query }, 'GET /loggedIn . . .')

  const authCode = shopifyConnector.verifyAuthCode(req.query, state)

  logger.info({ authCode }, 'GET /loggedIn auth code received, fetching access token')
  let fetchAccessTokenResult
  try {
    fetchAccessTokenResult = await shopifyConnector.fetchAccessToken(authCode)
  } catch (err) {
    logger.error(err)
    res.send(err.statusCode, 'Error fetching access token.')
  }

  logger.info({ fetchAccessTokenResult }, 'Got access token response')
  shopifyConnector.verifyAccessToken(fetchAccessTokenResult, state, nonce)

  accessToken = fetchAccessTokenResult.access_token
  logger.info('Got access token, fetching exchange token')

  let fetchExchangeTokenResult
  try {
    fetchExchangeTokenResult = await shopifyConnector.fetchExchangeToken(accessToken)
  } catch (err) {
    logger.error(err)
    res.send(err.statusCode, 'Error fetching exchange token.')
  }

  xAccessToken = fetchExchangeTokenResult.access_token
  logger.info({ fetchExchangeTokenResult }, 'Got exchange token, fetching customer data')

  res.redirect(`${selfBaseUrl}/profile`, v => v)
})

server.get('/profile', async (req, res) => {
  try {
    res.json(await shopifyConnector.fetchCustomerData(xAccessToken))
  } catch (err) {
    logger.error(err)
    res.send(err.statusCode, 'Error fetching customer data')
  }
})

server.get('/cart', async (req, res) => {
  try {
    await initCustomerAccessToken()
    await initCartId()
  } catch (err) {
    return res.send(500, 'Error creating cart')
  }

  try {
    res.json(await shopifyConnector.fetchCart(cartId))
  } catch (err) {
    logger.error(err)
    res.send(err.statusCode, 'Error fetching cart')
  }
})

server.get('/cart/add/:productVariantId', async (req, res) => {
  if (!req.params?.productVariantId) return res.send(400, 'Missing product variant ID in URL')

  try {
    await initCustomerAccessToken()
    await initCartId()
  } catch (err) {
    return res.send(500, 'Error creating cart')
  }

  try {
    res.json(await shopifyConnector.addProductToCart(cartId, [{ merchandiseId: `gid://shopify/ProductVariant/${req.params?.productVariantId}` }]))
  } catch (err) {
    logger.error(err)
    res.send(err.statusCode, 'Error fetching cart')
  }
})

server.get('/checkout', async (req, res) => {
  if (!cartId) return res.send(400, 'Add something to the cart first')

  const fetchCartResult =  await shopifyConnector.fetchCart(cartId)

  const checkoutUrl = fetchCartResult.data?.cart?.checkoutUrl
  if (!checkoutUrl) {
    return res.send(404, 'Checkout URL not found')
  }

  res.redirect(`${checkoutUrl}&=logged_in=true`, v => v)
})

server.listen(config.port, () => {
  logger.info('Listening on ' + config.port)
})

async function initCustomerAccessToken () {
  if (sAccessToken) return sAccessToken

  const storefrontAccessTokenResult = await shopifyConnector.fetchStorefrontAccessToken(xAccessToken)

  sAccessToken = storefrontAccessTokenResult?.data?.storefrontCustomerAccessTokenCreate?.customerAccessToken

  if (!sAccessToken) {
    logger.error({ storefrontAccessTokenResult }, 'No customer access token found')
    throw new Error('Customer access token not found')
  }
}

async function initCartId () {
  if (cartId) return cartId

  const createCartResult = await shopifyConnector.createCart(sAccessToken)

  cartId = createCartResult?.data?.cartCreate?.cart?.id

  if (!cartId) {
    logger.error({ createCartResult }, 'No cart ID found')
    throw new Error('Cart ID not found')
  }
}
