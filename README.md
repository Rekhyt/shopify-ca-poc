# Shopify Customer Accounts API PoC

Proof-of-concept for accessing the Shopify customer accounts API with a focus on the authorization flow.

## Set Up & Run
1. `npm i`
2. `nano .env` and add at least:
   - APP_URL=https://<ngrok identifier>.ngrok-free.app
   - SHOPIFY_SHOP_ID=1234567890
   - SHOPIFY_CUSTOMER_ACCOUNT_API_CONFIDENTIAL_CLIENT_ID=shp_...
   - SHOPIFY_CUSTOMER_ACCOUNT_API_CONFIDENTIAL_CLIENT_SECRET=...
   - for all config options & envs, see `config/schema.js`
3. `npm start`
