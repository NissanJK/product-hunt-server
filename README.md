# TechNest(ProductHunt Server)

This is the server-side application for the ProductHunt platform. It provides RESTful APIs to manage users, products, reviews, payments, and more. The server is built using Node.js, Express, and MongoDB.

## Live Site URL
[Visit the Live Site](https://product-hunt-server-rho.vercel.app/)

## Features

- **User Management**: Register, login, and manage user roles (admin, moderator, user).
- **Product Management**: Add, update, and retrieve products. Supports upvoting, reporting, and featured products.
- **Review Management**: Add and retrieve reviews for products.
- **Payment Integration**: Integrates with Stripe for payment processing.
- **Coupon Management**: Create, retrieve, and delete coupons (admin-only).
- **Statistics**: Get platform statistics like total products, users, and reviews (admin-only).
- **Authentication & Authorization**: Uses JWT for secure authentication and role-based access control.

## Technologies Used

- **Node.js**: JavaScript runtime for building the server.
- **Express**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing data.
- **Mongoose**: MongoDB object modeling for Node.js.
- **JWT (JSON Web Tokens)**: For secure authentication.
- **Stripe**: Payment processing.
- **CORS**: Middleware to enable Cross-Origin Resource Sharing.
- **Dotenv**: For managing environment variables.

## API Endpoints

### Authentication
- **POST /jwt**: Generate a JWT token for authentication.

### Users
- **GET /users**: Get all users (admin-only).
- **POST /users**: Register a new user.
- **GET /users/profile**: Get the profile of the authenticated user.
- **GET /users/moderator/:email**: Check if a user is a moderator.
- **GET /users/admin/:email**: Check if a user is an admin.
- **PATCH /users/make-moderator/:id**: Promote a user to moderator (admin-only).
- **PATCH /users/make-admin/:id**: Promote a user to admin (admin-only).

### Products
- **GET /products/featured**: Get featured products.
- **PATCH /products/featured/:id**: Mark a product as featured (moderator-only).
- **GET /products/trending**: Get trending products.
- **GET /products/reported**: Get reported products (moderator-only).
- **GET /products/:id**: Get a product by ID.
- **POST /products**: Add a new product.
- **GET /products/my-products**: Get products owned by the authenticated user.
- **PATCH /products/upvote/:id**: Upvote a product.
- **POST /products/report/:id**: Report a product.
- **GET /products/review-queue**: Get products pending review (moderator-only).
- **PATCH /products/status/:id**: Update product status (moderator-only).
- **GET /products/search**: Search for products.

### Reviews
- **GET /reviews/:productId**: Get reviews for a product.
- **POST /reviews**: Add a review.

### Payments
- **POST /create-payment-intent**: Create a payment intent with Stripe.
- **POST /payments**: Save payment details.
- **PATCH /users/update-subscription/:email**: Update user subscription status.

### Coupons
- **POST /coupons**: Add a new coupon (admin-only).
- **GET /coupons**: Get all coupons (admin-only).
- **DELETE /coupons/:id**: Delete a coupon (admin-only).

### Statistics
- **GET /statistics**: Get platform statistics (admin-only).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```plaintext
PORT=5000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
ACCESS_TOKEN_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Programming-Hero-Web-Course4/b10a12-server-side-NissanJK.git
   cd b10a12-server-side-NissanJK
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The server will start on the specified port (default is 5000).
