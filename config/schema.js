module.exports = {
  env: {
    doc: 'The application environment.',
    format: ['development'],
    default: 'development',
    env: 'NODE_ENV',
    arg: 'node-env'
  },
  name: {
    doc: 'Application name',
    format: String,
    default: 'shopify-customer-account-client',
    env: 'APP_NAME'
  },
  port: {
    doc: 'The application port',
    format: Number,
    default: 8080,
    env: 'APP_PORT'
  },
  shopUrl: {
    doc: 'The URL of the Shopify shop (e.g. myshop.myshopify.com)',
    format: String,
    default: '',
    env: 'SHOPIFY_SHOP_URL'
  },
  shopId: {
    doc: 'Shopify shop ID',
    format: String,
    default: '',
    env: 'SHOPIFY_SHOP_ID'
  },
  url: {
    doc: 'The application base URL',
    format: String,
    default: '',
    env: 'APP_URL'
  },
  storefrontApi: {
    accessToken: {
      doc: 'The access token to access the storefront',
      format: String,
      default: '',
      env: 'SHOPIFY_STOREFRONT_ACCESS_TOKEN'
    }
  },
  customerAccountApi: {
    public: {
      clientId: {
        doc: 'Shopify Customer Account API Client ID',
        format: String,
        default: '',
        env: 'SHOPIFY_CUSTOMER_ACCOUNT_API_PUBLIC_CLIENT_ID'
      }
    },
    confidential: {
      clientId: {
        doc: 'Shopify Customer Account API Client ID',
        format: String,
        default: '',
        env: 'SHOPIFY_CUSTOMER_ACCOUNT_API_CONFIDENTIAL_CLIENT_ID'
      },
      clientSecret: {
        doc: 'Shopify Customer Account API Client Secret',
        format: String,
        default: '',
        env: 'SHOPIFY_CUSTOMER_ACCOUNT_API_CONFIDENTIAL_CLIENT_SECRET'
      }
    }
  }
}
