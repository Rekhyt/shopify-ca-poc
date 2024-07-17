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
