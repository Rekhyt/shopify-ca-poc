# Shopify Customer Accounts API PoC

Proof-of-concept for accessing the Shopify customer accounts API with a focus on the authorization flow.

## Set Up & Run
1. `npm i`
2. `nano .env` and add at least:
   - `APP_URL=https://<ngrok identifier>.ngrok-free.app`
   - `SHOPIFY_SHOP_ID=1234567890`
   - `SHOPIFY_CUSTOMER_ACCOUNT_API_CONFIDENTIAL_CLIENT_ID=shp_...`
   - `SHOPIFY_CUSTOMER_ACCOUNT_API_CONFIDENTIAL_CLIENT_SECRET=...`
   - for all config options & envs, see `config/schema.js`
3. `npm start`
4. Open `$APP_URL/login` to start the authorization process

## Available Routes
- `/login` - redirects to Shopify login
- `/loggedIn` - authorization callback after successful login
- `/profile` - some basic info from the Customer Accounts API
- `/cart` - current cart contents, PoC on how Storefront API access works
- `/cart/add/<product variant ID>` - adds a product to the cart
- `/checkout` - redirects to the Shopify checkout page (or start page if cart is empty)
- `/loggedOut` - Shopify logout callback - not implemented

## Known issues
1. Tokens are only stored per run time, meaning you'll have to go via `/login` after each restart, including nodemon restarts.
