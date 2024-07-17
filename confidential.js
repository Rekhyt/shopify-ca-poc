require('dotenv').config()
const bunyan = require('bunyan')
const restify = require('restify')
const uuid = require('uuid').v4

const config = require('./config')
const logger = bunyan.createLogger({ name: config.name })
const server = restify.createServer()

server.use(restify.plugins.bodyParser())
server.use(restify.plugins.queryParser())

const selfBaseUrl = config.url
const ShopifyConnector = require('./ShopifyConnector')
const shopifyConnector = new ShopifyConnector(
  config.customerAccountApi.confidential.clientId,
  config.customerAccountApi.confidential.clientSecret,
  config.shopId,
  `${selfBaseUrl}/loggedIn`,
  `${selfBaseUrl}/loggedOut`,
  logger
)

let nonce
let state
let accessToken
let xAccessToken

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
    fetchAccessTokenResult = await shopifyConnector.fetchAccessToken(authCode, state)
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

server.listen(config.port, () => {
  logger.info('Listening on ' + config.port)
})
